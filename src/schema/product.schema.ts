import { z } from "zod";
import { categoryEnumValues, product } from "@/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { successResponseSchema } from "@/types/api";

// Base product schema
export const productSchema = createSelectSchema(product);

const currencyEnum = z.enum(["inr", "usd"]);

// Product schema for responses - allows float prices from service layer
export const productResponseSchema = createSelectSchema(product).extend({
  price: z.number(), // Allow both int and float for display prices
});

// Products data schema (the data part of success response)
export const productsDataSchema = z.object({
  products: z.array(
    productResponseSchema.extend({
      currency: currencyEnum,
    }),
  ),
});

// Get all products with optional category filter
export const getProductsSchema = {
  querystring: z.object({
    category: z.enum(categoryEnumValues).optional(),
  }),
  response: {
    200: successResponseSchema(productsDataSchema),
  },
};

// Get single product by ID
export const getProductByIdSchema = {
  params: z.object({
    productId: z.coerce.number().int().positive(),
  }),
  response: {
    200: successResponseSchema(
      z.object({ product: productResponseSchema.extend({ currency: currencyEnum }) }),
    ),
  },
};

export const createProductBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().int().positive(),
  category: z.enum(categoryEnumValues),
});

export const createProductSchema = {
  body: createProductBodySchema,
  response: {
    201: successResponseSchema(z.object({ product: productSchema })),
  },
};

export const updateProductBodySchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    price: z.number().int().positive().optional(),
    category: z.enum(categoryEnumValues).optional(),
  })
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
    200: successResponseSchema(
      z.object({ deleted: z.boolean(), productId: z.number() }),
    ),
  },
};

// ============ Type exports ============
export type GetProducts = z.infer<typeof productSchema>;
export type GetProductsQuery = z.infer<typeof getProductsSchema.querystring>;
export type GetProductByIdParams = z.infer<typeof getProductByIdSchema.params>;
export type ProductsData = z.infer<typeof productsDataSchema>;
export type CreateProductBody = z.infer<typeof createProductBodySchema>;
export type UpdateProductBody = z.infer<typeof updateProductBodySchema>;
export type UpdateProductParams = z.infer<typeof updateProductSchema.params>;
export type DeleteProductParams = z.infer<typeof deleteProductSchema.params>;
