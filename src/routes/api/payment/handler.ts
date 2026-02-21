import { FastifyReply, FastifyRequest } from "fastify";
import { paymentService } from "@/modules/payment.service";
import { z } from "zod";
import { razorpayService } from "@/modules/payment/razorpay.service";
import { config } from "@/lib/config";
import { sendError, sendSuccess } from "@/lib";

type CreatePaymentIntentRequest = {
  orderId: number;
  provider?: "polar" | "razorpay";
  customerEmail?: string;
  customerName?: string;
  successUrl?: string;
  externalCustomerId?: string;
};

export const createPaymentIntentRequestSchema = z.object({
  orderId: z.number(),
  provider: z.enum(["polar", "razorpay"]).optional(),
  customerEmail: z.string().email().optional(),
  customerName: z.string().optional(),
  successUrl: z.string().url().optional(),
  externalCustomerId: z.string().optional(),
}) satisfies z.ZodType<CreatePaymentIntentRequest>;

/**
 * Handler for creating a payment session for multiple providers.
 * - provider omitted -> Polar (existing behavior)
 * - provider = "razorpay" -> create Razorpay Order and return order + keyId
 */
export async function createPaymentIntentHandler(
  request: FastifyRequest<{
    Body: CreatePaymentIntentRequest;
  }>,
  reply: FastifyReply,
) {
  const { orderId, provider } = request.body;

  try {
    if (provider === "razorpay") {
      const { customerEmail, customerName, successUrl, externalCustomerId } =
        request.body;
      const { order, internalOrderId } = await razorpayService.createOrder(
        orderId,
        {
          customerEmail,
          customerName,
          successUrl,
          externalCustomerId,
        },
      );

      return sendSuccess(
        {
          order,
          keyId: config.RAZORPAY_KEY_ID,
          internalOrderId,
          successUrl: successUrl || config.SUCCESS_URL,
        },
        "Razorpay order created",
        reply,
        201,
      );
    }

    // default: Polar checkout flow (existing)
    const { checkoutUrl, checkoutId } =
      await paymentService.createPaymentCheckout(orderId);

    return sendSuccess(
      { checkoutUrl, checkoutId },
      "Payment checkout created",
      reply,
      201,
    );
  } catch (error) {
    if (error instanceof Error) {
      return sendError("CREATE_PAYMENT_FAILED", error.message, reply, 400);
    }
    return sendError(
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error",
      reply,
      500,
    );
  }
}

// Stripe webhook handler is deprecated
export async function stripeWebhookHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  return sendError(
    "STRIPE_DEPRECATED",
    "Stripe is deprecated. Use Polar.",
    reply,
    410,
  );
}
