import Fastify, { type FastifyServerOptions } from "fastify";
import autoLoad from "@fastify/autoload";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import cors from "@fastify/cors";

export default async function fastifyServer(opt: FastifyServerOptions) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const fastify = Fastify(opt);

  await fastify.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });

  // Auto-register routes
  await fastify.register(autoLoad, {
    dir: join(__dirname, "routes"),
    forceESM: true,
    routeParams: true,
  });

  return fastify;
}