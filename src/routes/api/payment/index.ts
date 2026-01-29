import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { createPaymentIntentHandler, stripeWebhookHandler } from "./handler";
import { z } from "zod";

export default async function paymentRoutes(fastify: FastifyInstance) {
  const fastifyWithZod = fastify.withTypeProvider<ZodTypeProvider>();

  fastifyWithZod.post(
    "/intent",
    {
      schema: {
        body: z.object({
          orderId: z.number(),
        }),
        response: {
          200: z.object({
            checkoutUrl: z.string(),
            checkoutId: z.string(),
          }),
        },
      },
    },
    createPaymentIntentHandler,
  );

  fastify.post(
    "/webhook",
    { config: { rawBody: true } as any },
    stripeWebhookHandler,
  );
}
