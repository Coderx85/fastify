import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import Fastify from "fastify";
import {
  ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { db } from "@/db";

describe("Checkout confirmation page", () => {
  let app: ReturnType<typeof Fastify> | null = null;

  beforeAll(async () => {
    const { default: checkoutRoutes } = await import("./index");
    app = Fastify({ logger: false }).withTypeProvider<ZodTypeProvider>();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    // register under /checkout to mirror autoload behavior
    await app.register(checkoutRoutes, { prefix: "/checkout" });
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it("GET /checkout/success should show payment status for an order", async () => {
    const { orders, users, payments } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    // create user + order + payment
    const [user] = await db
      .insert(users)
      .values({
        name: "c",
        email: `t+${Date.now()}@example.com`,
        password: "x",
        createdAt: new Date(),
      })
      .returning();
    const [orderRow] = await db
      .insert(orders)
      .values({
        userId: user.id,
        totalAmount: 100,
        status: "processing",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const paymentId = `pm_test_${Date.now()}`;
    await db
      .insert(payments)
      .values({
        id: paymentId,
        orderId: orderRow.id,
        amount: 100,
        currency: "usd",
        status: "succeeded",
        paymentMethod: "razorpay",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    const res = await supertest(app.server).get(
      `/checkout/success?orderId=${orderRow.id}`,
    );
    expect(res.status).toBe(200);
    expect(res.text).toContain("Payment Confirmation");
    expect(res.text).toContain(paymentId);

    // cleanup
    await db.delete(payments).where(eq(payments.id, paymentId));
    await db.delete(orders).where(eq(orders.id, orderRow.id));
    await db.delete(users).where(eq(users.id, user.id));
  });
});
