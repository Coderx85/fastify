import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import { forgotPasswordSchema } from "@/schema/auth.schema";
import { forgotPasswordHandler } from "./handler";

export default async function forgotPasswordRoute(fastify: FastifyInstance) {
  fastify.withTypeProvider<ZodTypeProvider>().post("/", {
    schema: forgotPasswordSchema,
    handler: forgotPasswordHandler.handler,
  });
}
