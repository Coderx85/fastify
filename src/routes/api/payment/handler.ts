import { FastifyReply, FastifyRequest } from "fastify";
import { paymentService } from "@/modules/payment.service";
import { z } from "zod";

const createPaymentIntentRequestSchema = z.object({
  orderId: z.number(),
});

/**
 * Handler for creating a payment session (Polar Checkout)
 * Replaces the Stripe Payment Intent handler
 */
export async function createPaymentIntentHandler(
  request: FastifyRequest<{
    Body: z.infer<typeof createPaymentIntentRequestSchema>;
  }>,
  reply: FastifyReply,
) {
  const { orderId } = request.body;

  try {
    const { checkoutUrl, checkoutId } =
      await paymentService.createPaymentCheckout(orderId);

    // Return the URL for frontend redirection
    return reply.send({ checkoutUrl, checkoutId });
  } catch (error) {
    if (error instanceof Error) {
      return reply.status(400).send({ error: error.message });
    }
    return reply.status(500).send({ error: "Internal Server Error" });
  }
}

// Stripe webhook handler is deprecated
export async function stripeWebhookHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  return reply.status(410).send({ error: "Stripe is deprecated. Use Polar." });
}
