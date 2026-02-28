import { z } from "zod";

export const createUserSchema = {
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
  }),
};
export type CreateUserBody = z.infer<typeof createUserSchema.body>;

export const getUserSchema = {
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
};
export type UserIdParams = z.infer<typeof getUserSchema.params>;

export const updateUserSchema = {
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
  }),
};
export type UpdateUserBody = z.infer<typeof updateUserSchema.body>;

export const deleteUserSchema = {
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
};

export const getUserByEmailSchema = {
  querystring: z.object({
    email: z.string().email(),
  }),
};

// GET - /api/users/:id?orderId=123s

export const getOrderByUserIdSchema = {
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
  querystring: z.object({
    orderId: z.string().transform((val) => parseInt(val, 10)),
  }),
};
