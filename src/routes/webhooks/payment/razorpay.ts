import { FastifyRequest, FastifyReply } from "fastify";
import { handleRazorpayWebhookHandler } from "../../api/payment/handler";

/**
 * Razorpay Webhook Handler
 * POST /webhooks/payment/razorpay
 * Processes Razorpay payment webhooks
 */
export default async function razorpayWebhookHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  return handleRazorpayWebhookHandler.handler(request, reply);
}
