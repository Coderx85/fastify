import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  razorpayCheckOutHandler,
  razorpayWebhookHandler,
  razorpayVerifyHandler,
  razorpayStatusHandler,
} from "./handler";
import { createRazorpayCheckoutSchema } from "@/schema/payment.schema";

const CreateCheckoutSchema = createRazorpayCheckoutSchema;
const VerifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export default async function razorpayRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post("/checkout", {
    schema: {
      body: CreateCheckoutSchema,
      description: "Create a Razorpay order for an existing orderId",
      tags: ["Razorpay", "Checkout"],
    },
    handler: razorpayCheckOutHandler.handler,
  });

  app.get("/webhook", {
    config: { rawBody: true } as unknown as object, // Fastify doesn't have built-in raw body support, this is a workaround to access the raw body in the handler
    handler: razorpayWebhookHandler.handler,
  });

  app.post(
    "/verify",
    {
      schema: {
        body: VerifyPaymentSchema,
        description: "Verify Razorpay payment signature (for client-side flow)",
        tags: ["Razorpay", "Verification"],
      },
    },
    razorpayVerifyHandler.handler,
  );

  app.get("/status", {
    handler: razorpayStatusHandler.handler,
  });
}
