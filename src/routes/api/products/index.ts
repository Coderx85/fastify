import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import {
  getProductsSchema,
  getProductByIdSchema,
} from "@/schema/product.schema";
import { getProductsHandler } from "./handler";
import { getProductByIdHandler } from "./[productId]/handler";

// Get all products (with optional category filter)
// GET /products         → returns all products
// GET /products?category=Electronics → returns filtered products
export default async function productsRoute(fastify: FastifyInstance) {
  // Get all products (with optional category filter)
  fastify.withTypeProvider<ZodTypeProvider>().get("/", {
    schema: getProductsSchema,
    handler: getProductsHandler.handler,
  });

  // Get product by ID
  // GET /products/:productId → returns single product
  fastify.withTypeProvider<ZodTypeProvider>().get("/:productId", {
    schema: getProductByIdSchema,
    handler: getProductByIdHandler.handler,
  });
}
