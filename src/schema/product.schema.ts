import { z } from "zod";
import {
  categoryEnumValues,
  productsTable as product,
  productInsertSchema,
} from "@/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { successResponseSchema } from "@/types/api";

// Define a currency enum for both INR and USD
const currencyEnum = z.enum(["inr", "usd"]);

// Base product schema
export const productSchema = createSelectSchema(product);
const productResponseSchema = productSchema;

// For exchange rates in the create product response
const rateMapSchema = z.record(currencyEnum, z.number());

// ============ Create Product Schemas ============
export const createProductInputSchema = productInsertSchema.extend({
  amount: z.number().positive(),
  currency: currencyEnum,
});

export const createProductResultSchema = productResponseSchema.extend({
  rates: rateMapSchema,
});

export const createProductSchema = {
  body: createProductInputSchema,
  response: {
    201: successResponseSchema(createProductResultSchema),
  },
};

// ============ Get Product by ID Schemas ============
export const getProductByIdSchema = {
  params: z.object({
    productId: z.coerce.number().int().positive(),
  }),
  response: {
    200: successResponseSchema(
      z.object({
        product: productResponseSchema.extend({ currency: currencyEnum }),
      }),
    ),
  },
};

// ============ Update Product Schemas ============
export const updateProductBodySchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    price: z.number().int().positive().optional(),
    category: z.enum(categoryEnumValues).optional(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the product",
  });

export const updateProductSchema = {
  params: z.object({
    productId: z.coerce.number().int().positive(),
  }),
  body: updateProductBodySchema,
  response: {
    200: successResponseSchema(z.object({ product: productSchema })),
  },
};

// ============ Delete Product Schemas ============
export const deleteProductSchema = {
  params: z.object({
    productId: z.coerce.number().int().positive(),
  }),
  response: {
    200: successResponseSchema(z.object({ success: z.boolean() })),
  },
};

// ============ Type exports ============
export type CreateProductInput = z.infer<typeof createProductInputSchema>;
export type GetProducts = z.infer<typeof productSchema>;
export type UpdateProductBody = z.infer<typeof updateProductBodySchema>;
export type UpdateProductParams = z.infer<typeof updateProductSchema.params>;
export type DeleteProductParams = z.infer<typeof deleteProductSchema.params>;
