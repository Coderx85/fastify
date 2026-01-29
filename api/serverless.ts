// Register tsconfig-paths before any other imports to resolve @/* aliases
import { register } from "tsconfig-paths";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Register path aliases for runtime resolution
register({
  baseUrl: join(__dirname, ".."),
  paths: {
    "@/*": ["src/*"],
  },
});

import "dotenv/config";
import Fastify from "fastify";
import autoLoad from "@fastify/autoload";
import cors from "@fastify/cors";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import type { IncomingMessage, ServerResponse } from "http";

// Instantiate Fastify with serverless config
const app = Fastify({
  logger: true,
});

// Set the validator and serializer compilers
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Register CORS
app.register(cors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

// Auto-register API routes from src folder
app.register(autoLoad, {
  dir: join(__dirname, "../src/routes"),
  routeParams: true,
});

export default async (req: IncomingMessage, res: ServerResponse) => {
  await app.ready();
  app.server.emit("request", req, res);
};
