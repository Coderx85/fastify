import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import { getProductByIdSchema } from "@/schema/product.schema";
import { getProductByIdHandler } from "./handler";

export default async function productByIdRoute(fastify: FastifyInstance) {
  // Get product by ID
  fastify.withTypeProvider<ZodTypeProvider>().get("/", {
    schema: getProductByIdSchema,
    handler: getProductByIdHandler.handler,
  });
}
