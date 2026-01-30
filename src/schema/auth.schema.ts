import { z } from "zod";
import { users } from "@/db/schema";
import { createInsertSchema } from "drizzle-zod";

export const loginSchema = {
  body: createInsertSchema(users).pick({ email: true, password: true }),
};

export const registerSchema = {
  body: createInsertSchema(users).pick({
    name: true,
    email: true,
    password: true,
  }),
};

export const forgotPasswordSchema = {
  body: createInsertSchema(users).pick({
    email: true,
  }),
};

export const resetPasswordSchema = {
  body: z.object({
    token: z.string(),
    password: z.string().min(6),
  }),
};

export type LoginBody = z.infer<typeof loginSchema.body>;
export type RegisterBody = z.infer<typeof registerSchema.body>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema.body>;
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema.body>;

// Backward compatibility
export const authSchema = loginSchema.body;
export type AuthBody = LoginBody;
