import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import { registerSchema } from "@/schema/auth.schema";
import { registerRouteHandler } from "./handler";

export default async function registerRoute(fastify: FastifyInstance) {
  fastify.withTypeProvider<ZodTypeProvider>().post("/", {
    schema: registerSchema,
    handler: registerRouteHandler.handler,
  });
}
