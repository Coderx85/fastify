import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { payments } from "../db/schema";

// insert schema for payments
export const insertPaymentSchema = createInsertSchema(payments).extend({
  status: z.enum(["pending"]).default("pending"),
  createdAt: z.date().default(new Date()),
  updatedAt: z.date().optional(),
});
export type NewPayment = z.infer<typeof insertPaymentSchema>;

// select schema for payments
const paymentSchema = createSelectSchema(payments).omit({
  updatedAt: true,
});

export type TPayment = z.infer<typeof paymentSchema>;
