import { paymentSelectSchema, TProduct } from "@/db/schema";
import {
  insertPaymentSchema,
  createPolarPaymentSchema,
} from "@/schema/payment.schema";
import { createRazorpayPaymentSchema } from "@/schema/razorpay.schema";
import { z } from "zod";

export type NewPayment = z.infer<typeof insertPaymentSchema>;

export type PaymentProvider = "polar" | "razorpay";

export type CurrencyEnum = "usd" | "inr";

export type PaymentStatus = "pending" | "completed" | "failed";

export type Payment = z.infer<typeof paymentSelectSchema>;

export type createRazorpayPaymentInput = z.infer<
  typeof createRazorpayPaymentSchema
>;

export interface IProducts extends TProduct {
  currency: CurrencyEnum;
}

export type createPolarPaymentInput = z.infer<typeof createPolarPaymentSchema>;

export type CreatePaymentInput =
  | createRazorpayPaymentInput
  | createPolarPaymentInput;
