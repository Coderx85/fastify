import { z } from "zod";

export const loginSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
};

export const registerSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
};

export const forgotPasswordSchema = {
  body: z.object({
    email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
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
