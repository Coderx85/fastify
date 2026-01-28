import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { eq } from "drizzle-orm";

import { createUserSchema, getUserSchema } from "@/schema/user.schema";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/hash";
import { sendError, sendSuccess } from "@/lib/response";
import { db } from "@/db";

export default async function usersRoute(fastify: FastifyInstance) {
  // GET /api/users
  fastify.get("/", async (request, reply) => {
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users);

    sendSuccess(allUsers, "Users retrieved successfully", reply, 200);
  });

  // GET /api/users/:id
  fastify.withTypeProvider<ZodTypeProvider>().get(
    "/:id",
    {
      schema: getUserSchema,
    },
    async (request, reply) => {
      const { id } = request.params;

      const foundUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, id));

      const user = foundUsers[0];

      if (!user) {
        return sendError("User not found", "NOT_FOUND", reply, 404);
      }

      sendSuccess(user, "User retrieved successfully", reply, 200);
    },
  );

  // POST /api/users
  fastify.withTypeProvider<ZodTypeProvider>().post(
    "/",
    {
      schema: createUserSchema,
    },
    async (request, reply) => {
      const { name, email, password } = request.body;

      // Check if email exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      if (existingUser.length > 0) {
        return sendError(
          "User with this email already exists",
          "CONFLICT",
          reply,
          409,
        );
      }

      const hashedPassword = hashPassword(password);

      const newUser = await db
        .insert(users)
        .values({
          name,
          email,
          password: hashedPassword,
        })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
        });

      sendSuccess(newUser[0], "User created successfully", reply, 201);
    },
  );
}
