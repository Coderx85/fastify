import { db } from "@/db";
import { payments, orders, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NewPayment } from "@/schema/payment.schema";
import { polarService } from "./payment/polar.service";
import { config } from "@/lib/config";
import { STATUS_CODES } from "http";
import { PaymentProvider } from "@/types/payment";
import Razorpay from "razorpay";
import { OrderService } from "./order.service";

/**
 * Payment Service (Polar.sh Sandbox Implementation)
 * Replaces the previous Stripe logic with Polar Checkouts
 */
interface IPaymentService {
  createPaymentCheckout(orderId: number): Promise<{
    checkoutUrl: string;
    checkoutId: string;
  }>;
  initialize(method: PaymentProvider): Promise<void>;
}

const razorpayService = new Razorpay({
  key_id: config.RAZORPAY_KEY_ID,
  key_secret: config.RAZORPAY_KEY_SECRET,
});

type CRazorpayService = typeof razorpayService;

class PaymentService implements IPaymentService {
  constructor(
    private razorpayService: CRazorpayService,
    private orderService: OrderService,
  ) {
    // You can perform any necessary initialization here
    const razoppay = new Razorpay({
      key_id: config.RAZORPAY_KEY_ID,
      key_secret: config.RAZORPAY_KEY_SECRET,
    });
  }

  async razorpayCreateOrder(
    orderId: number,
    userId: number,
    address: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string | number;
    },
  ) {
    try {
      // Fetch order details from the database

      const checkOrder = await this.orderService.getOrderById(orderId);
      if (!checkOrder) {
        throw new Error(`Order with ID ${orderId} not found`);
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      if (!address) {
        throw new Error(
          `Address details are required to create Razorpay order`,
        );
      }

      const order = await this.razorpayService.orders.create({
        amount: 10000, // Example amount in paise (100 INR)
        currency: "Rupees",
        receipt: `receipt_${orderId}`,
        customer_details: {
          name: user.name,
          email: user.email,
          contact: user.contact.toString(),
          billing_address: {
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            country: address.country,
            zipcode: address.postalCode,
          },
          shipping_address: {
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            country: address.country,
            zipcode: address.postalCode,
          },
        },
      });

      return order;
    } catch (error: unknown) {
      throw new Error("Failed to create Razorpay order", {
        cause: {
          STATUS_CODES: STATUS_CODES["500"],
          error,
        },
      });
    }
  }

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
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    const orderData = order;

    // 2. Create Polar Checkout (Sandbox Mode is automatic via config)
    const checkout = await polarService.createCheckout({
      customerEmail: "sandbox_user@example.com", // Pre-fill for easier testing
      customerName: "Sandbox User",
      externalCustomerId: `sandbox-customer-${orderId}`, // Unique ID for tracking
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

  async initialize(method: PaymentProvider) {
    /**
     * Steps to initialize payment providers in production:
     *
     * Step 01. Product details, User details, and Order details should be stored in your database. This is crucial for creating accurate payment requests and tracking transactions.
     * Step 02: Create the checkout flow for the selected payment provider (Polar or Razorpay) using their respective SDKs and APIs. This involves generating payment links, handling user redirection, and managing payment sessions.
     * Step 03: Store the generated checkout IDs and related payment information in your database to track the status of each payment and associate it with the corresponding order and user.
     * Step 04: Implement webhook handlers to listen for payment events from the providers (e.g., payment success, failure, refunds) and update the payment status in your system accordingly. This ensures that your application remains in sync with the payment provider's status updates.
     */

    switch (method) {
      case "polar":
        break;
      case "razorpay":
        // Initialize Razorpay SDK or any necessary setup here
        console.log("Initializing Razorpay payment provider...");
        break;
      default:
        throw new Error(`Unsupported payment provider: ${method}`);
    }
  }
}

export const paymentService = new PaymentService(
  razorpayService,
  new OrderService(),
);
