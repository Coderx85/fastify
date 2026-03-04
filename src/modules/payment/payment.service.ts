import {
  IPaymentService,
  PaymentIntentResult,
  PaymentMetadata,
  UnsupportedCurrencyError,
  WebhookVerificationError,
  PaymentValidationError,
} from "./payment.definition";
import { CurrencyType as Currency } from "@/modules/currency/currency.service";
import { razorpayService } from "./razorpay.service";
import { OrderService } from "../orders/order.service";
import {
  currencyService,
  type PaymentMethod,
} from "@/modules/currency/currency.service";
import { IOrderCreateInput } from "../orders/order.definition";
import { config } from "@/lib/config";

/**
 * High-level payment service used by the e‑commerce order flow.
 *
 * Responsibilities:
 * - choose provider based on order currency/payment method
 * - stash full order input in provider metadata for later replay
 * - handle incoming webhooks and create orders when payment succeeds
 */
export class PaymentService implements IPaymentService {
  constructor(
    private razor = razorpayService,
    // private polar = polarService,
    private orderService = new OrderService(),
  ) {}

  /**
   * Start a payment for an order.  The caller must supply the exact order
   * input (matching IOrderInput from the orders module) as well as the
   * user id so we can create the order later.
   *
   * Uses Razorpay as the sole payment provider.
   */
  async initiatePayment(
    orderInput: IOrderCreateInput,
    userId: number,
  ): Promise<PaymentIntentResult> {
    if (!orderInput || typeof userId !== "number") {
      throw new PaymentValidationError("orderInput and userId are required");
    }

    // Use requested currency if provided, otherwise derive from payment method
    let currency: Currency = orderInput.totalAmountCurrency as Currency;
    if (!currency) {
      currency = currencyService.getCurrencyByPaymentMethod(
        orderInput.paymentMethod as PaymentMethod,
      ) as Currency;
    }

    if (!currency) {
      throw new UnsupportedCurrencyError(
        String(orderInput.paymentMethod || "<unknown>"),
      );
    }

    // Razorpay supports both INR and USD (for international accounts)
    if (currency !== "inr" && currency !== "usd") {
      throw new UnsupportedCurrencyError(
        `Currency ${currency} is not supported. Only INR and USD are supported for Razorpay.`,
      );
    }

    const metadata: PaymentMetadata = { orderInput, userId };
    const metaString = JSON.stringify(metadata);

    try {
      // Use Razorpay for all payments
      // razorpay requires numeric orderId; we don't yet have one so pass 0
      const { order, internalOrderId } = await this.razor.createOrder(0, {
        metadata: { 
          orderPayload: metaString, 
          amount: String(orderInput.totalAmount || 0),
          currency: currency.toUpperCase()
        },
      });

      return {
        provider: "razorpay",
        providerOrderId: order.id,
        razorpayKeyId: config.RAZORPAY_KEY_ID,
        raw: { order, internalOrderId },
      };
    } catch (err) {
      console.error("Failed to create Razorpay order:", err);
      throw err;
    }
  }

  async handleRazorpayWebhook(rawBody: string, signature: string) {
    const verified = this.razor.verifyWebhookSignature(rawBody, signature);
    if (!verified) {
      throw new WebhookVerificationError("invalid razorpay signature");
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      // if body was already parsed we can try req.body, but handler passes string
      payload = {};
    }

    const event = payload.event;
    if (event === "payment.captured" || event === "order.paid") {
      const notes =
        payload.payload?.payment?.entity?.notes ||
        payload.payload?.order?.entity?.notes;
      if (notes && notes.orderPayload) {
        const { orderInput, userId } = JSON.parse(
          notes.orderPayload,
        ) as PaymentMetadata;
        await this.orderService.createOrder(orderInput, userId);
      }

      // also mark payment succeeded in the database for bookkeeping
      const orderId =
        payload.payload?.payment?.entity?.order_id ||
        payload.payload?.order?.entity?.id;
      if (orderId) {
        await this.razor.markPaymentSucceeded(orderId);
      }
    }
  }

  // COMMENTED OUT: Polar webhook handling - Using Razorpay only
  // async handlePolarWebhook(payload: any) {
  //   // Polar library already verified signature before invoking config
  //   const eventType: string = payload.type;

  //   // we only care about orders that completed (paid is safe)
  //   if (eventType === "order.paid" || eventType === "order.created") {
  //     const metadata = payload.data?.metadata;
  //     if (metadata && metadata.orderPayload) {
  //       const { orderInput, userId } = JSON.parse(
  //         metadata.orderPayload,
  //       ) as PaymentMetadata;
  //       await this.orderService.createOrder(orderInput, userId);
  //     }
  //   }
  // }
}

export const paymentService = new PaymentService();
