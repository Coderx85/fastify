import { payments, paymentStatusEnum } from "@/db/schema";
import { z } from "zod";

import { createInsertSchema, createSelectSchema } from "drizzle-zod";

const paymentStatusValues = paymentStatusEnum.enumValues;

export const insertPaymentSchema = createInsertSchema(payments).extend({
  status: z.enum(paymentStatusValues).default(paymentStatusValues[0]),
  createdAt: z.date().default(new Date()),
  updatedAt: z.date().optional(),
});

const paymentSchema = createSelectSchema(payments).omit({
  updatedAt: true,
});

export const createRazorpayCheckoutIntentSchema = {
  body: z.object({
    orderId: z.number(),
    provider: z.enum(["polar", "razorpay"]).optional(),
  }),
  response: {
    200: z.object({
      checkoutUrl: z.string().optional(),
      checkoutId: z.string().optional(),
      keyId: z.string().optional(),
      order: z.any().optional(),
    }),
  },
};

// For Razorpay, we enforce currency and paymentMethod values at the schema level
export const razorpayPaymentSchema = paymentSchema.extend({
  currency: z.literal("inr").default("inr"),
  paymentMethod: z.literal("razorpay").default("razorpay"),
  status: z.enum(paymentStatusValues).default(paymentStatusValues[0]),
});

export const createRazorpayPaymentSchema = razorpayPaymentSchema
  .omit({ id: true, createdAt: true })
  .extend({
    currency: z.literal("inr").default("inr"),
    paymentMethod: z.literal("razorpay").default("razorpay"),
    status: z.enum(paymentStatusValues).default("failed"),
  })
  .refine(
    (d) =>
      d.paymentMethod === "razorpay" &&
      d.currency === "inr" &&
      d.status === paymentStatusValues[0],
    {
      message: "Payment method must be razorpay and currency must be inr",
    },
  );
