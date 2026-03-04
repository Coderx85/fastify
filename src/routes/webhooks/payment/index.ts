import { FastifyInstance } from "fastify";
import razorpayWebhookHandler from "./razorpay";

/**
 * Payment Webhook Routes
 * Handles webhooks from payment providers
 * Currently only supporting Razorpay
 */
export default async function paymentWebhookRoutes(fastify: FastifyInstance) {
  // POST /webhooks/payment/razorpay - Razorpay webhook
  fastify.post("/razorpay", razorpayWebhookHandler);
}
