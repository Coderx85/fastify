import Razorpay from "razorpay";
import crypto from "crypto";
import { config } from "@/lib/config";
import { db } from "@/db";
import {
  ordersTable as orders,
  paymentsTable as payments,
  addressesTable,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { STATUS_CODES } from "http";
import { CreateOrderInput, CreateOrderOutput } from "@/schema/order.schema";
import { userService } from "../users/user.service";
import { orderService } from "../orders/order.service";
import { createOrderId } from "@/lib/uuid";

import { getUser } from "@/middleware/auth.middleware";

type Options = {
  amount: number; // in paisa for INR
  currency: string; // Razorpay requires uppercase ISO 4217 codes e.g. "INR"
  receipt?: string;
  payment_capture: number;
  notes: Record<string, string>;
};

/**
 * Razorpay backend wrapper that persists payments to the database.
 * - createOrder: creates a Razorpay Order and inserts a pending payment row
 * - verifyPaymentSignature: verifies payment signature after client reports success
 * - verifyWebhookSignature: verifies webhook payload using webhook secret
 * - markPaymentSucceeded: updates the payment row status to 'succeeded'
 */
class RazorpayService {
  private client: Razorpay | null = null;
  private orderService = orderService;

  constructor() {
    this.orderService = orderService;
  }

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
    orderId: number,
    opts?: {
      customerEmail?: string;
      customerName?: string;
      externalCustomerId?: string;
      successUrl?: string;
      metadata?: Record<string, string | number | boolean>;
    },
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
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
      // For payment initiation, we don't create a full order yet.
      // The order will be created when the webhook confirms payment.
      // Just create the Razorpay order and store metadata.
      internalOrderId = 0; // No internal order ID yet
    }

    // Continue with Razorpay order creation regardless of whether we have an internal order
    const currency = (opts?.metadata?.currency as string) || "INR";
    
    // Both INR and USD use 100 as the multiplier for smallest unit (Paisa/Cents)
    const totalAmountInSmallestUnit = opts?.metadata?.amount
      ? Math.round(Number(opts.metadata.amount) * 100)
      : 0;

    const options: Options = {
      amount: totalAmountInSmallestUnit,
      currency: currency,
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

    // Note: We only insert the payment record after the webhook confirms payment.
    // During payment initiation, we don't have a valid orderId yet, so we skip
    // the database insert here. The payment is persisted when the webhook is received.

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

  async initialize() {
    // Ensure Razorpay client is initialized on startup
    this.getClient();
    console.log("RazorpayService initialized");
  }

  async processOrderPayment(orderInput: CreateOrderInput) {
    // This method can be used to process an order payment, e.g., by creating a Razorpay order

    try {
      const razorpay = this.getClient();

      const dummyUser = await getUser();
      const userId = dummyUser.id;

      const user = await userService.getUserById(userId);

      if (!user) {
        throw new Error("User not found for order payment processing");
      }

      const totalAmountInPaisas =
        (await this.orderService.calculateTotalAmount(
          orderInput.products,
          "inr",
        )) * 100;

      const Options: Options = {
        amount: totalAmountInPaisas,
        currency: "INR",
        receipt: `order_${orderInput.id}`,
        payment_capture: 1,
        notes: {
          internalOrderId: String(orderInput.id),
          customerEmail: user.email,
          customerName: user.name,
        },
      };

      const payment = await razorpay.orders.create(Options);

      if (payment.status === "paid") {
        // Create internal order record and persist payment info
        const totalAmount = await this.orderService.calculateTotalAmount(
          orderInput.products,
          "inr",
        );

        const order = await orderService.createOrder(
          {
            id: orderInput.id,
            userId,
            paymentMethod: "razorpay",
            totalAmount,
            totalAmountCurrency: "inr",
            notes: orderInput.notes || "",
            billingAddress: orderInput.billingAddress,
            shippingAddress: orderInput.shippingAddress,
            products: orderInput.products,
          },
          userId,
        );

        return { order, payment };
      } else {
        throw new Error(`Payment failed with status: ${payment.status}`);
      }
    } catch (error: unknown) {
      throw new Error(`Failed to process order payment: ${error}`, {
        cause: error,
      });
    }
  }
}

export const razorpayService = new RazorpayService();
