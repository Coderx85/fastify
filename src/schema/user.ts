import { z } from "zod";

export const createUserSchema = {
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
  }),
};
export type CreateUserBody = z.infer<typeof createUserSchema.body>;

export const getUserSchema = {
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
};
export type UserIdParams = z.infer<typeof getUserSchema.params>;

// Backward compatibility
export const userIdSchema = getUserSchema.params;
