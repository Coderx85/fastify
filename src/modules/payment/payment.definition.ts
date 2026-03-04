import { IOrderInput } from "@/modules/orders/order.definition";
import { paymentMethodEnum } from "@/db/schema";
import { FastifyReply, FastifyRequest } from "fastify";

export const paymentMethod = paymentMethodEnum.enumValues;

type PaymentProvider = (typeof paymentMethod)[number];

// metadata stored on the provider so we can recreate the order later
export interface PaymentMetadata {
  orderInput: IOrderInput;
  userId: number;
}

// result returned when initiating a payment intent/checkout
export interface PaymentIntentResult {
  provider: PaymentProvider;
  providerOrderId: string;
  razorpayKeyId?: string;
  checkoutUrl?: string;
  raw?: any;
}

export interface IPaymentService {
  initiatePayment(
    orderInput: IOrderInput,
    userId: number,
  ): Promise<PaymentIntentResult>;

  /**
   * Process a webhook coming from Razorpay (raw body + signature header)
   * the implementation should verify the signature and create the order
   */
  handleRazorpayWebhook(rawBody: string, signature: string): Promise<void>;

  // COMMENTED OUT: Polar webhook handling - Using Razorpay only
  // handlePolarWebhook(payload: any): Promise<void>;
}

// --------- custom errors ---------
export class UnsupportedCurrencyError extends Error {
  constructor(currency: string) {
    super(`Unsupported currency: ${currency}`);
    this.name = "UnsupportedCurrencyError";
  }
}

export class PaymentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentValidationError";
  }
}

export class WebhookVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebhookVerificationError";
  }
}

// --------- controller interface ---------
import { PaymentInitiateRequest } from "@/schema/payment.schema";

export interface IPaymentController {
  // initiating a payment uses a specialized request shape rather than the
  // generic IOrderInput so we can require userId and omit fields not needed
  initiatePaymentHandler(
    request: FastifyRequest<{ Body: PaymentInitiateRequest }>,
    reply: FastifyReply,
  ): Promise<void>;

  handleRazorpayWebhookHandler(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void>;

  // COMMENTED OUT: Polar webhook handler - Using Razorpay only
  // handlePolarWebhookHandler(
  //   request: FastifyRequest,
  //   reply: FastifyReply,
  // ): Promise<void>;
}
