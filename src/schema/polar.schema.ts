import { z } from "zod";

// Zod schemas for request validation
export const CreateCheckoutSchema = z.object({
  orderId: z.number(),
  userId: z.string(),
  customerEmail: z.string().email(),
  customerName: z.string(),
  externalCustomerId: z.string(),
  successUrl: z.string().url(),
  returnUrl: z.string().url().optional(),
});

export const ExternalIdParamSchema = z.object({
  externalId: z.string(),
});
