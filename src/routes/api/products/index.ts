import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import {
  getProductByIdSchema,
  createProductSchema,
  updateProductSchema,
  deleteProductSchema,
} from "@/schema/product.schema";
import {
  // getProductsHandler,
  // getProductByIdHandler,
  createProductHandler,
  // updateProductHandler,
  // deleteProductHandler,
} from "./handler";

/**
 * Product routes
 *
 @GET /products         → returns all products (with optional ?category filter)
 @POST /products        → create a new product
 @GET /products/:id     → returns single product
 @PUT /products/:id     → update a product
 @DELETE /products/:id  → delete a product
 */
export default async function productsRoute(fastify: FastifyInstance) {
  // Get all products (with optional category filter)
  // fastify.withTypeProvider<ZodTypeProvider>().get("/", {
  //   handler: getProductsHandler.handler,
  // });

  // Create a new product
  fastify.withTypeProvider<ZodTypeProvider>().post("/", {
    schema: createProductSchema,
    handler: createProductHandler.handler,
  });

  // // Get product by ID
  // fastify.withTypeProvider<ZodTypeProvider>().get("/:productId", {
  //   schema: getProductByIdSchema,
  //   handler: getProductByIdHandler.handler,
  // });

  // // Update a product
  // fastify.withTypeProvider<ZodTypeProvider>().put("/:productId", {
  //   schema: updateProductSchema,
  //   handler: updateProductHandler.handler,
  // });

  // // Delete a product
  // fastify.withTypeProvider<ZodTypeProvider>().delete("/:productId", {
  //   schema: deleteProductSchema,
  //   handler: deleteProductHandler.handler,
  // });
}
