import { z } from "zod";
import { buildJsonSchemas } from "fastify-zod";

const productCore = {
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be less than 255 characters"),
  description: z.string().optional(),
  price: z.number().int().min(1, "Price must be greater than 0"),
};

export const productSchema = z.object({
  id: z.number().int(),
  ...productCore,
});

export const createProductSchema = z.object({
  ...productCore,
});

export const createProductResponseSchema = productSchema;

export const getProductsSchema = z.array(productSchema);

export const getProductParams = z.object({
  id: z.coerce.number(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

// export const { schemas: productSchemas, $ref } = buildJsonSchemas(
//   {
//     createProductSchema,
//     createProductResponseSchema,
//     getProductsSchema,
//     getProductParams,
//     productSchema,
//   },
//   { $id: "product" },
// );
