import { z } from "zod";
import { categoryEnumValues, product } from "@/db/schema";
import { createSelectSchema } from "drizzle-zod";

// Base product schema
export const productSchema = createSelectSchema(product);

// ============ Response Schemas ============

// Success response wrapper
const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    ok: z.literal(true),
    statusCode: z.number(),
    message: z.string(),
    data: dataSchema,
  });

// Error response schema
export const errorResponseSchema = z.object({
  ok: z.literal(false),
  statusCode: z.number(),
  message: z.string(),
  error: z.string(),
});

// Products data schema (the data part of success response)
export const productsDataSchema = z.object({
  products: z.array(productSchema),
});

// ============ Route Schemas ============

// Get all products with optional category filter
export const getProductsSchema = {
  querystring: z.object({
    category: z.enum(categoryEnumValues).optional(),
  }),
  response: {
    200: successResponseSchema(productsDataSchema),
    404: errorResponseSchema,
    500: errorResponseSchema,
  },
};

// Get single product by ID
export const getProductByIdSchema = {
  params: z.object({
    productId: z.coerce.number().int().positive(),
  }),
  response: {
    200: successResponseSchema(z.object({ product: productSchema })),
    404: errorResponseSchema,
    500: errorResponseSchema,
  },
};

// ============ Type exports ============
export type GetProducts = z.infer<typeof productSchema>;
export type GetProductsQuery = z.infer<typeof getProductsSchema.querystring>;
export type GetProductByIdParams = z.infer<typeof getProductByIdSchema.params>;
export type ProductsData = z.infer<typeof productsDataSchema>;
export type SuccessResponse<T> = {
  ok: true;
  statusCode: number;
  message: string;
  data: T;
};
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
