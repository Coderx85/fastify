import { FastifyInstance } from "fastify";

export default async function rootRoute(fastify: FastifyInstance) {
  fastify.get("/", async function handler(request, reply) {
    reply.type("text/html");
    return "Hello World";
  });
}
