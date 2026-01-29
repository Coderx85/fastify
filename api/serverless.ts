import "dotenv/config";
import Fastify from "fastify";
import serverPlugin from "../src/server";
import type { IncomingMessage, ServerResponse } from "http";

// Instantiate Fastify with serverless config
const app = Fastify({
  logger: true,
});

// Register the main application as a plugin
app.register(serverPlugin);

export default async (req: IncomingMessage, res: ServerResponse) => {
  await app.ready();
  app.server.emit("request", req, res);
};
