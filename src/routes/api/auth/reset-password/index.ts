import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import { resetPasswordSchema } from "@/schema/auth.schema";
import { resetPasswordHandler } from "./handler";

export default async function resetPasswordRoute(fastify: FastifyInstance) {
  fastify.withTypeProvider<ZodTypeProvider>().post("/", {
    schema: resetPasswordSchema,
    handler: resetPasswordHandler.handler,
  });
}
