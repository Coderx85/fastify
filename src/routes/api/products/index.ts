import { FastifyPluginAsync } from "fastify";
import {
  createProductHandler,
  getProductByIdHandler,
  getProductsHandler,
} from "./handler";
import {
  createProductSchema,
  getProductsSchema,
  getProductParams,
  productSchema,
} from "@/schema/product.schema";
import { ZodTypeProvider } from "fastify-type-provider-zod";

const plugin: FastifyPluginAsync = async (fastify) => {
  fastify.withTypeProvider<ZodTypeProvider>().post("/", {
    schema: createProductSchema,
    handler: createProductHandler,
  });

  fastify.withTypeProvider<ZodTypeProvider>().get("/", {
    schema: getProductsSchema,
    handler: getProductsHandler,
  });

  fastify.withTypeProvider<ZodTypeProvider>().get("/:id", {
    schema: {
      params: getProductParams,
      response: {
        200: productSchema,
      },
    },
    handler: getProductByIdHandler,
  });
};

export default plugin;
