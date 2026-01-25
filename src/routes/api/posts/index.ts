import { FastifyInstance } from "fastify";

export default async function postsRoute(fastify: FastifyInstance) {
  fastify.get("/", async (request, reply) => {
    return {
      status: "success",
      data: [
        { id: 1, title: "First Post", content: "Hello World", author: "John" },
        {
          id: 2,
          title: "Second Post",
          content: "Fastify is awesome",
          author: "Jane",
        },
      ],
    };
  });
}
