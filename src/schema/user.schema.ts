import { successResponseSchema } from "@/types/api";
import { z } from "zod";
import { orderResultSchema } from "./order.schema";
import { createUpdateSchema } from "drizzle-zod";
import { usersTable } from "@/db/schema";

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
  response: {
    200: successResponseSchema(orderResultSchema),
  },
};

// PUT - /api/users/:userId

export const updateUserSchema = {
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
  body: createUpdateSchema(usersTable)
    .omit({
      id: true,
      password: true,
      createdAt: true,
      updatedAt: true,
    })
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one field must be provided for update",
    )
    .safeExtend({
      email: z.string().email().optional(),
      contact: z
        .string()
        .length(10, "Contact must be exactly 10 digits")
        .transform((val) => val.replace(/\D/g, ""))
        .optional(),
    }),
};

export type UpdateUserBody = z.infer<typeof updateUserSchema.body>;
