import Fastify, {
  type FastifyServerOptions,
  type FastifyInstance,
} from "fastify";
import autoLoad from "@fastify/autoload";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import cors from "@fastify/cors";
import {
  ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import fp from "fastify-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Plugin version for serverless deployment
async function fastifyServerPlugin(fastify: FastifyInstance) {
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
}

// Export as a Fastify plugin for serverless
export default fp(fastifyServerPlugin, {
  name: "fastify-server",
});

// Build function for standalone server
export async function buildServer(opt: FastifyServerOptions) {
  const fastify = Fastify(opt).withTypeProvider<ZodTypeProvider>();
  await fastify.register(fastifyServerPlugin);
  return fastify;
}
