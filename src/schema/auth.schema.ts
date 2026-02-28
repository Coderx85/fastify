import { z } from "zod";
import { usersTable as users } from "@/db/schema";
import { createInsertSchema } from "drizzle-zod";
import { errorResponseSchema, successResponseSchema } from "@/types/api";
import { UserDTO } from "@/dtos/user.dto";

const loginDTO = z.object({
  user: UserDTO,
  token: z.string(),
});

export type TAuthUserDTO = z.infer<typeof loginDTO>;

export const loginSchema = {
  body: createInsertSchema(users)
    .pick({ email: true, password: true })
    .refine((v) => !!v.email, {
      message: "Email must be provided",
      path: ["email"],
    })
    .refine((v) => !!v.password, {
      message: "Password must be provided",
      path: ["password"],
    }),
  response: {
    200: successResponseSchema(loginDTO),
  },
};

export const registerSchema = {
  body: createInsertSchema(users).pick({
    name: true,
    email: true,
    password: true,
    contact: true,
  }),
  response: {
    201: successResponseSchema(loginDTO),
  },
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

export type LoginSchemaInput = z.infer<typeof loginSchema.body>;
export type RegisterBody = z.infer<typeof registerSchema.body>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema.body>;
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema.body>;

// Backward compatibility
export const authSchema = loginSchema.body;
export type AuthBody = LoginSchemaInput;
