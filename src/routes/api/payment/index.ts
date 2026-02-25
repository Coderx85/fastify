import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { createPaymentIntentHandler, stripeWebhookHandler } from "./handler";
import { z } from "zod";
import { createRazorpayCheckoutIntentSchema } from "@/schema/razorpay.schema";
import { CreateRazorpayCheckoutIntentSchema as RazorpaySchema } from "./handler";

export const createPaymentIntentSchema = z.object({
  checkoutUrl: z.string().optional(),
  checkoutId: z.string().optional(),
  keyId: z.string().optional(),
  order: z.any().optional(),
});

export default async function paymentRoutes(fastify: FastifyInstance) {
  const fastifyWithZod = fastify.withTypeProvider<ZodTypeProvider>();

  fastifyWithZod.post("/intent", {
    schema: {
      body: createRazorpayCheckoutIntentSchema.body,
      response: {
        200: createPaymentIntentSchema,
      },
      description:
        "Create a payment session for an order. If provider is razorpay, creates a Razorpay order and returns order details + keyId for client-side checkout. If provider is polar or omitted, creates a Polar checkout session and returns the checkout URL.",
      tags: ["Payment", "Checkout"],
    },
    handler: createPaymentIntentHandler,
  });

  fastify.post(
    "/webhook",
    { config: { rawBody: true } as object },
    stripeWebhookHandler,
  );

  fastifyWithZod.post("/razorpay", {
    schema: {
      body: RazorpaySchema.body,
      response: {
        200: RazorpaySchema.response[200],
      },
      description:
        "Create a Razorpay order and returns order details + keyId for client-side checkout.",
      tags: ["Payment", "Checkout"],
    },
    handler: createPaymentIntentHandler,
  });
}
