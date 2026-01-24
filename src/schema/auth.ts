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

export type LoginBody = z.infer<typeof loginSchema.body>;
export type RegisterBody = z.infer<typeof registerSchema.body>;

// Backward compatibility
export const authSchema = loginSchema.body;
export type AuthBody = LoginBody;
