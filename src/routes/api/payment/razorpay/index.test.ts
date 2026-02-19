import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Fastify from "fastify";
import {
  ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import type { FastifyInstance } from "fastify";
import crypto from "crypto";

// Ensure webhook secret is available for the route's config import
process.env.RAZORPAY_WEBHOOK_SECRET =
  process.env.RAZORPAY_WEBHOOK_SECRET || "test_webhook_secret";

describe("Razorpay Routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    // dynamically import routes AFTER setting env so config picks it up
    const { default: razorpayRoutes } = await import("./index");

    app = Fastify({ logger: false }).withTypeProvider<ZodTypeProvider>();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    await app.register(razorpayRoutes, { prefix: "/api/payment/razorpay" });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/payment/razorpay/status should return configuration status", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/payment/razorpay/status",
    });
    expect([200]).toContain(response.statusCode);
  });

  it("POST /api/payment/razorpay/checkout should return 400 for missing orderId", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/payment/razorpay/checkout",
      payload: {},
    });
    expect(response.statusCode).toBe(400);
  });

  it("POST /api/payment/razorpay/checkout with valid orderId should create order or return API error", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/payment/razorpay/checkout",
      payload: {
        orderId: 1,
        customerEmail: "test@example.com",
        customerName: "Test User",
        successUrl: "/checkout/success",
      },
    });

    // If keys are configured and API reachable expect 201, otherwise allow 500/401
    expect([201, 401, 500]).toContain(response.statusCode);
  });

  it("POST /api/payment/razorpay/webhook should return 400 without signature", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/payment/razorpay/webhook",
      payload: { some: "payload" },
    });
    expect(response.statusCode).toBe(400);
  });

  it("POST /api/payment/razorpay/webhook with valid signature updates DB", async () => {
    const testPaymentId = `test_order_razorpay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Dynamic imports so config/db pick up test env set above
    const { db } = await import("@/db");
    const { payments, users, orders } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    // Create a user -> order -> payment chain so FK constraints are satisfied
    const [user] = await db
      .insert(users)
      .values({
        name: "test user",
        email: `test+${Date.now()}@example.com`,
        password: "x",
        createdAt: new Date(),
      })
      .returning();

    const [orderRow] = await db
      .insert(orders)
      .values({
        userId: user.id,
        totalAmount: 300,
        status: "processing",
        shippingAddress: "",
        paymentMethod: "credit_card",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Insert a pending payment row to simulate prior createOrder
    await db.insert(payments).values({
      id: testPaymentId,
      orderId: orderRow.id,
      amount: 300,
      currency: "usd",
      status: "pending",
      paymentMethod: "razorpay",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const payload = {
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            order_id: testPaymentId,
            id: "pay_test_1",
            status: "captured",
          },
        },
      },
    };

    const raw = JSON.stringify(payload);
    const signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET as string)
      .update(raw)
      .digest("hex");

    // Sanity-check the service's verifier directly
    const { razorpayService } =
      await import("@/modules/payment/razorpay.service");
    const ok = razorpayService.verifyWebhookSignature(raw, signature);
    expect(ok, "local verifier should accept the test signature").toBe(true);

    const response = await app.inject({
      method: "POST",
      url: "/api/payment/razorpay/webhook",
      headers: { "x-razorpay-signature": signature },
      payload,
    });

    // If signature verification fails here but passed above, the route may be
    // using a different rawBody value; log response body for debugging.
    if (response.statusCode !== 200) {
      // eslint-disable-next-line no-console
      console.error("Webhook response body:", response.body);
    }

    expect(response.statusCode).toBe(200);
    const [row] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, testPaymentId));
    expect(row).toBeDefined();
    expect(row.status).toBe("succeeded");

    // cleanup
    await db.delete(payments).where(eq(payments.id, testPaymentId));
    await db
      .delete((await import("@/db/schema")).orders)
      .where(eq((await import("@/db/schema")).orders.id, orderRow.id));
    await db
      .delete((await import("@/db/schema")).users)
      .where(eq((await import("@/db/schema")).users.id, user.id));
  });

  it("POST /api/payment/razorpay/verify should verify signature and update DB", async () => {
    const testPaymentId = `verify_order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const { db } = await import("@/db");
    const { payments, users, orders } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const [user] = await db
      .insert(users)
      .values({
        name: "verify user",
        email: `verify+${Date.now()}@example.com`,
        password: "x",
        createdAt: new Date(),
      })
      .returning();

    const [orderRow] = await db
      .insert(orders)
      .values({
        userId: user.id,
        totalAmount: 300,
        status: "processing",
        shippingAddress: "",
        paymentMethod: "credit_card",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await db.insert(payments).values({
      id: testPaymentId,
      orderId: orderRow.id,
      amount: 300,
      currency: "usd",
      status: "pending",
      paymentMethod: "razorpay",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const paymentId = "pay_verify_1";
    const payloadString = `${testPaymentId}|${paymentId}`;
    const signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(payloadString)
      .digest("hex");

    const response = await app.inject({
      method: "POST",
      url: "/api/payment/razorpay/verify",
      payload: {
        razorpay_order_id: testPaymentId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      },
    });

    expect(response.statusCode).toBe(200);

    const [row] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, testPaymentId));
    expect(row).toBeDefined();
    expect(row.status).toBe("succeeded");

    // cleanup
    await db.delete(payments).where(eq(payments.id, testPaymentId));
    await db.delete(orders).where(eq(orders.id, orderRow.id));
    await db.delete(users).where(eq(users.id, user.id));
  });
});
