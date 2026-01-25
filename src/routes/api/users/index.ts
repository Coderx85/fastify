import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import { createUserSchema, getUserSchema } from "@/schema/user.js";

export default async function usersRoute(fastify: FastifyInstance) {
  // GET /api/users
  fastify.get("/", async (request, reply) => {
    return {
      status: "success",
      data: [
        { id: 1, name: "John Doe", email: "john@example.com" },
        { id: 2, name: "Jane Smith", email: "jane@example.com" },
        { id: 3, name: "Bob Johnson", email: "bob@example.com" },
      ],
    };
  });

  // GET /api/users/:id
  fastify.withTypeProvider<ZodTypeProvider>().get(
    "/:id",
    {
      schema: getUserSchema,
    },
    async (request, reply) => {
      const { id } = request.params;
      return {
        status: "success",
        data: { id, name: "John Doe", email: "john@example.com" },
      };
    },
  );

  // POST /api/users
  fastify.withTypeProvider<ZodTypeProvider>().post(
    "/",
    {
      schema: createUserSchema,
    },
    async (request, reply) => {
      const { name, email } = request.body;
      return {
        status: "created",
        data: { id: 4, name, email },
      };
    },
  );
}
