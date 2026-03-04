import { FastifyRequest, FastifyReply } from "fastify";
import { PaymentValidationError } from "@/modules/payment/payment.definition";
import { paymentService } from "@/modules/payment";
import { sendSuccess, sendError } from "@/lib/response";
import {
  PaymentInitiateRequest,
  PaymentIntentResult,
} from "@/schema/payment.schema";
import {
  currencyService,
  type PaymentMethod,
  type CurrencyType,
} from "@/modules/currency/currency.service";
import { OrderService } from "@/modules/orders/order.service";
import { IOrderCreateInput } from "@/modules/orders/order.definition";

const orderService = new OrderService();

/**
 * Handler for payment initiation
 * POST /api/payment/initiate
 * - Takes order input and user ID
 * - Returns checkout URL or payment details
 */
export const initiatePaymentHandler = {
  handler: async (
    request: FastifyRequest<{ Body: PaymentInitiateRequest }>,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const body = request.body as any;
      const userId = body.userId;

      if (!userId || typeof userId !== "number") {
        return sendError(
          "INVALID_REQUEST",
          "User ID is required and must be a number",
          reply,
          400,
        );
      }

      // Derive currency from payment method if not provided
      let totalAmountCurrency: CurrencyType = body.totalAmountCurrency;
      if (!totalAmountCurrency) {
        const derived = currencyService.getCurrencyByPaymentMethod(
          body.paymentMethod as PaymentMethod,
        );
        if (!derived) {
          return sendError(
            "INVALID_REQUEST",
            `Cannot determine currency for payment method: ${body.paymentMethod}`,
            reply,
            400,
          );
        }
        totalAmountCurrency = derived;
      }

      // Calculate total amount from products if not provided
      let totalAmount: number = body.totalAmount;
      if (totalAmount === undefined || totalAmount === null) {
        try {
          totalAmount = await orderService.calculateTotalAmount(
            body.products,
            totalAmountCurrency,
          );
        } catch (err) {
          const msg =
            err instanceof Error
              ? err.message
              : "Failed to calculate total amount";
          return sendError("CALCULATION_ERROR", msg, reply, 400);
        }
      }

      const orderInput: IOrderCreateInput = {
        userId,
        paymentMethod: body.paymentMethod,
        totalAmount,
        totalAmountCurrency,
        billingAddress: body.billingAddress,
        shippingAddress: body.shippingAddress,
        products: body.products,
        notes: body.notes,
      };

      // Initiate payment with the payment service
      const paymentResult: PaymentIntentResult =
        await paymentService.initiatePayment(orderInput, userId);

      return sendSuccess(
        paymentResult,
        "Payment initiated successfully",
        reply,
        200,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Payment initiation failed";
      const statusCode = error instanceof PaymentValidationError ? 400 : 500;
      return sendError("PAYMENT_ERROR", message, reply, statusCode);
    }
  },
};

/**
 * Handler for Razorpay webhook
 * POST /webhooks/payment/razorpay
 * - Raw request body for signature verification
 * - Signature header validation
 */
export const handleRazorpayWebhookHandler = {
  handler: async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      // Get raw body for signature verification
      const rawBody =
        typeof request.body === "string"
          ? request.body
          : JSON.stringify(request.body);
      const signature = request.headers["x-razorpay-signature"] as string;

      if (!signature) {
        return sendError(
          "MISSING_SIGNATURE",
          "Missing Razorpay signature header",
          reply,
          401,
        );
      }

      // Handle the webhook
      await paymentService.handleRazorpayWebhook(rawBody, signature);

      return sendSuccess(
        { success: true, message: "Webhook processed successfully" },
        "Razorpay webhook processed",
        reply,
        200,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Webhook processing failed";
      console.error("Razorpay webhook error:", error);
      return sendError("WEBHOOK_ERROR", message, reply, 400);
    }
  },
};