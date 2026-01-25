import Fastify, { type FastifyServerOptions } from "fastify";
import autoLoad from "@fastify/autoload";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import cors from "@fastify/cors";
import {
  ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

export default async function fastifyServer(opt: FastifyServerOptions) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const fastify = Fastify(opt).withTypeProvider<ZodTypeProvider>();

  // Set the validator and serializer compilers
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  await fastify.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });

  // Auto-register API routes
  await fastify.register(autoLoad, {
    dir: join(__dirname, "routes"),
    routeParams: true,
  });

  return fastify;
}
