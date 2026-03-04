import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { initiatePaymentHandler } from "./handler";
import { initiatePaymentSchema } from "@/schema/payment.schema";

/**
 * Payment API Routes
 * Handles payment initiation
 * Webhooks are handled in /routes/webhooks/payment/
 */
export default async function paymentRoutes(fastify: FastifyInstance) {
  // POST /api/payment/initiate - Start a payment
  fastify.withTypeProvider<ZodTypeProvider>().post("/initiate", {
    schema: initiatePaymentSchema,
    handler: initiatePaymentHandler.handler,
  });
}
