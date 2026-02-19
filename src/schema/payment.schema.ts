import { check, z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { payments, paymentStatusEnum } from "../db/schema";

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

export const createRazorpayCheckoutSchema = z.object({
  orderId: z.number(),
  // Optional customer info to pre-fill / attach to the Razorpay order
  customerEmail: z.string().email().optional(),
  customerName: z.string().optional(),
  // Optional redirect/confirmation URL (your frontend)
  successUrl: z.string().url().optional(),
  // Optional external customer id (your internal user id)
  externalCustomerId: z.string().optional(),
});

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
