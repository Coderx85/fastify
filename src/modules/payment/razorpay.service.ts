import Razorpay from "razorpay";
import crypto from "crypto";
import { config } from "@/lib/config";
import { ordersSample } from "@/sample/orders.sample";
import { db } from "@/db";
import { orders, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { STATUS_CODES } from "http";

/**
 * Razorpay backend wrapper that persists payments to the database.
 * - createOrder: creates a Razorpay Order and inserts a pending payment row
 * - verifyPaymentSignature: verifies payment signature after client reports success
 * - verifyWebhookSignature: verifies webhook payload using webhook secret
 * - markPaymentSucceeded: updates the payment row status to 'succeeded'
 */
class RazorpayService {
  private client: Razorpay | null = null;

  private getClient(): Razorpay {
    if (!config.RAZORPAY_KEY_ID || !config.RAZORPAY_KEY_SECRET) {
      throw new Error(
        "Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
      );
    }
    if (!this.client) {
      this.client = new Razorpay({
        key_id: config.RAZORPAY_KEY_ID,
        key_secret: config.RAZORPAY_KEY_SECRET,
      });
    }
    return this.client;
  }

  async createOrder(
    orderId?: number,
    opts?: {
      customerEmail?: string;
      customerName?: string;
      externalCustomerId?: string;
      successUrl?: string;
      metadata?: Record<string, string | number | boolean>;
    },
  ) {
    // If an internal order exists, use it; otherwise create a lightweight order row
    let internalOrderId = orderId;
    let orderRecord: typeof orders.$inferSelect | undefined;

    if (internalOrderId) {
      const [found] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, internalOrderId));
      if (found) {
        orderRecord = found;
      }
    }

    if (!orderRecord) {
      const [createdOrder] = await db
        .insert(orders)
        .values({
          userId: opts?.externalCustomerId
            ? Number(opts.externalCustomerId) || 1
            : 1,
          totalAmount: 300,
          status: "processing",
          shippingAddress: "",
          paymentMethod: "credit_card",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      orderRecord = createdOrder;
      internalOrderId = createdOrder.id;
    }

    if (!orderRecord || !internalOrderId) {
      throw new Error("Order creation failed", { cause: STATUS_CODES[500] });
    }

    // Determine amount in smallest currency unit for Razorpay
    const currency = config.RAZORPAY_CURRENCY || "INR";

    const amount =
      currency === "INR"
        ? orderRecord.totalAmount * 100
        : orderRecord.totalAmount;

    const options: any = {
      amount: amount,
      currency,
      receipt: `order_${internalOrderId}`,
      payment_capture: 1,
      notes: {
        internalOrderId: String(internalOrderId),
        ...(opts?.externalCustomerId
          ? { externalCustomerId: opts.externalCustomerId }
          : {}),
        ...(opts?.customerEmail ? { customerEmail: opts.customerEmail } : {}),
        ...(opts?.customerName ? { customerName: opts.customerName } : {}),
        ...(opts?.successUrl ? { successUrl: opts.successUrl } : {}),
      },
    };

    if (opts?.metadata) {
      Object.entries(opts.metadata).forEach(([k, v]) => {
        options.notes[`meta_${k}`] = String(v);
      });
    }

    const created = await this.getClient().orders.create(options);

    if (!created || !created.id) {
      throw new Error("Failed to create Razorpay order");
    }

    // Persist pending payment row connected to the *internal* order id
    const dbCurrency = ["usd"].includes((currency || "").toLowerCase())
      ? ((currency || "").toLowerCase() as "usd")
      : "usd";

    try {
      await db.insert(payments).values({
        id: created.id,
        orderId: internalOrderId,
        amount: orderRecord.totalAmount,
        currency: dbCurrency,
        status: "pending",
        paymentMethod: "razorpay",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (err) {
      console.error("Failed to persist Razorpay payment to DB:", err);
    }

    return { order: created, internalOrderId };
  }

  verifyPaymentSignature(
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string,
  ) {
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", config.RAZORPAY_KEY_SECRET)
      .update(payload)
      .digest("hex");

    return expected === razorpay_signature;
  }

  verifyWebhookSignature(rawBody: string, signature: string) {
    if (!config.RAZORPAY_WEBHOOK_SECRET) return false;
    const expected = crypto
      .createHmac("sha256", config.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");
    return expected === signature;
  }

  async markPaymentSucceeded(razorpayOrderId: string) {
    try {
      const result = await db
        .update(payments)
        .set({ status: "succeeded", updatedAt: new Date() })
        .where(eq(payments.id, razorpayOrderId));
      return result;
    } catch (err) {
      console.error("Failed to mark payment succeeded:", err);
      throw err;
    }
  }
}

export const razorpayService = new RazorpayService();
