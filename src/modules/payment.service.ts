import { db } from "@/db";
import { payments } from "@/db/schema";
// // import { eq } from "drizzle-orm";
import { NewPayment } from "@/schema/payment.schema";
import { polarService } from "./payment/polar.service";
import { config } from "@/lib/config";
import { ordersSample } from "@/sample/orders.sample";
import { STATUS_CODES } from "http";

/**
 * Payment Service (Polar.sh Sandbox Implementation)
 * Replaces the previous Stripe logic with Polar Checkouts
 */
class PaymentService {
  /**
   * Create a Polar Checkout for a specific Order
   * This generates a payment link for the user to pay for an order
   *
   * @param orderId The ID of the order to pay for
   */
  async createPaymentCheckout(
    orderId: number,
  ): Promise<{ checkoutUrl: string; checkoutId: string }> {
    // // 1. Fetch the Order
    // const [order] = await db
    //   .select()
    //   .from(orders)
    //   .where(eq(orders.id, orderId))
    //   .limit(1);

    // use the sample order for now
    const order = ordersSample.find((order) => order.id === orderId);

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    const orderData = order;

    // 2. Create Polar Checkout (Sandbox Mode is automatic via config)
    const checkout = await polarService.createCheckout({
      customerEmail: "sandbox_user@example.com", // Pre-fill for easier testing
      successUrl: `${config.SUCCESS_URL}?orderId=${orderId}`,
      metadata: {
        orderId: orderId.toString(),
        environment: "sandbox",
      },
    });

    // 3. Record the pending payment in our DB
    const newPayment: NewPayment = {
      id: checkout.checkoutId, // Using Checkout ID as temporary ref
      orderId: orderId,
      amount: orderData.totalAmount, // Amount in cents
      currency: "usd",
      status: "pending",
      paymentMethod: "polar",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!checkout.checkoutUrl || !checkout.checkoutId) {
      throw new Error("Failed to create Polar checkout");
    }

    if (!newPayment.id) {
      throw new Error("Payment ID is required");
    }

    // Upsert or insert payment record
    const result = await db.insert(payments).values(newPayment);

    if (!result) {
      throw new Error("Failed to record payment in database", {
        cause: {
          STATUS_CODES: STATUS_CODES["500"],
        },
      });
    }

    // addPayment(newPayment);

    return {
      checkoutUrl: checkout.checkoutUrl,
      checkoutId: checkout.checkoutId,
    };
  }
}

export const paymentService = new PaymentService();
