import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import { loginSchema } from "@/schema/auth.schema";
import { loginRouteHandler } from "./handler";

export default async function loginRoute(fastify: FastifyInstance) {
  fastify.withTypeProvider<ZodTypeProvider>().post("/", {
    schema: loginSchema,
    handler: loginRouteHandler.handler,
  });
}
