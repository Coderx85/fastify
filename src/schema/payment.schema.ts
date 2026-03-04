import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  addressInsertSchema,
  paymentsTable as payments,
  paymentStatusEnum,
} from "@/db/schema";

// predefined payment status values and initial status
const paymentStatusValues = paymentStatusEnum.enumValues;

// insert schema for payments
export const insertPaymentSchema = createInsertSchema(payments).extend({
  status: z.enum(paymentStatusValues).default(paymentStatusValues[0]),
  createdAt: z.date().default(new Date()),
  updatedAt: z.date().optional(),
});
export type NewPayment = z.infer<typeof insertPaymentSchema>;

// select schema for payments
const paymentSchema = createSelectSchema(payments).omit({
  updatedAt: true,
});

export const createRazorpayCheckoutSchema = z
  .object({
    orderId: z.number(),
    // Optional customer info to pre-fill / attach to the Razorpay order
    customerEmail: z.string().email().optional(),
    customerName: z.string().optional(),
    // Optional redirect/confirmation URL (your frontend)
    successUrl: z.string().url().optional(),
    // Optional external customer id (your internal user id)
    externalCustomerId: z.string().optional(),
  })
  .and(addressInsertSchema.partial());

// For Polar, we allow currency and paymentMethod to be set to their defaults, but they can be overridden if needed

export const polarPaymentSchema = paymentSchema.extend({
  currency: z.literal("usd").default("usd"),
  paymentMethod: z.literal("polar").default("polar"),
  status: z.enum(["pending", "completed", "failed"]).default("pending"),
});

export const createPolarPaymentSchema = polarPaymentSchema
  .omit({ id: true, createdAt: true })
  .extend({
    currency: z.literal("usd").default("usd"),
    paymentMethod: z.literal("polar").default("polar"),
    status: z.enum(["pending", "completed", "failed"]).default("pending"),
  })
  .refine(
    (d) =>
      d.paymentMethod === "polar" &&
      d.currency === "usd" &&
      d.status === "pending",
    {
      message: "Payment method must be polar and currency must be usd",
    },
  );

///////////////////////////////////////////////////////////////////
// ADDRESS SCHEMA - can be used for both Polar and Razorpay orders
///////////////////////////////////////////////////////////////////

import { successResponseSchema } from "@/types/api";
import { currencyEnum, paymentMethodEnum } from "@/db/schema";
import { addressInput } from "./order.schema";

const orderItemInputSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
});

// ============ Payment Initiation Schema ============

export const orderAddressInput = addressInput;

export const paymentInitiateRequestSchema = z.object({
  userId: z.number().int().positive(),
  paymentMethod: z.enum(paymentMethodEnum.enumValues),
  totalAmount: z.number().positive().optional(),
  totalAmountCurrency: z.enum(currencyEnum.enumValues).optional(),
  billingAddress: orderAddressInput,
  shippingAddress: orderAddressInput,
  products: z
    .array(orderItemInputSchema)
    .min(1, "At least one product is required"),
  notes: z.string().optional(),
});

export const paymentIntentResultSchema = z.object({
  provider: z.enum(["razorpay"]), // Only Razorpay now
  providerOrderId: z.string(),
  razorpayKeyId: z.string().optional(),
  checkoutUrl: z.string().url().optional(),
  raw: z.any().optional(),
});

export const initiatePaymentSchema = {
  body: paymentInitiateRequestSchema,
  response: {
    200: successResponseSchema(paymentIntentResultSchema),
  },
};

export type PaymentInitiateRequest = z.infer<
  typeof paymentInitiateRequestSchema
>;
export type PaymentIntentResult = z.infer<typeof paymentIntentResultSchema>;

// ============ Webhook Response Schemas ============

export const razorpayWebhookSchema = z.object({
  event: z.string(),
  payload: z.record(z.string(), z.any()),
  signature: z.string().optional(),
});

export const polarWebhookSchema = z.object({
  type: z.string(),
  data: z.record(z.string(), z.any()),
});

export const webhookResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type RazorpayWebhook = z.infer<typeof razorpayWebhookSchema>;
export type PolarWebhook = z.infer<typeof polarWebhookSchema>;
export type WebhookResponse = z.infer<typeof webhookResponseSchema>;
