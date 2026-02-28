import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { eq } from "drizzle-orm";

import {
  createUserSchema,
  // getUserSchema,
  updateUserSchema,
  deleteUserSchema,
  getUserByEmailSchema,
} from "@/schema/user.schema";
import { usersTable as users } from "@/db/schema";
import { hashPassword } from "@/lib/hash";
import { sendError, sendSuccess } from "@/lib/response";
import { db } from "@/db";

export default async function usersRoute(fastify: FastifyInstance) {
  // GET /api/users
  fastify.withTypeProvider<ZodTypeProvider>().get(
    "/",
    {
      schema: getUserByEmailSchema,
    },
    async (
      request: FastifyRequest<{
        Querystring: {
          email?: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      if (request.query.email) {
        const user = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
          })
          .from(users)
          .where(eq(users.email, request.query.email));
        return sendSuccess(user, "User retrieved successfully", reply, 200);
      }
      const allUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(users);

      sendSuccess(allUsers, "Users retrieved successfully", reply, 200);
    },
  );

  // // GET /api/users/:id
  // fastify.withTypeProvider<ZodTypeProvider>().get(
  //   "/:id",
  //   {
  //     schema: getUserSchema,
  //   },
  //   async (request, reply) => {
  //     const { id } = request.params;

  //     const foundUsers = await db
  //       .select({
  //         id: users.id,
  //         name: users.name,
  //         email: users.email,
  //       })
  //       .from(users)
  //       .where(eq(users.id, id));

  //     const user = foundUsers[0];

  //     if (!user) {
  //       return sendError("User not found", "NOT_FOUND", reply, 404);
  //     }

  //     sendSuccess(user, "User retrieved successfully", reply, 200);
  //   },
  // );

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
          contact: "wewewe", // Placeholder, adjust as needed
        })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
        });

      sendSuccess(newUser[0], "User created successfully", reply, 201);
    },
  );

  // PUT /api/users/:id
  fastify.withTypeProvider<ZodTypeProvider>().put(
    "/:id",
    {
      schema: updateUserSchema,
    },
    async (request, reply) => {
      const { id } = request.params;
      const { name, email } = request.body;

      const updatedUser = await db
        .update(users)
        .set({ name, email })
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
        });

      if (updatedUser.length === 0) {
        return sendError("User not found", "NOT_FOUND", reply, 404);
      }

      sendSuccess(updatedUser[0], "User updated successfully", reply, 200);
    },
  );

  // DELETE /api/users/:id
  fastify.withTypeProvider<ZodTypeProvider>().delete(
    "/:id",
    {
      schema: deleteUserSchema,
    },
    async (request, reply) => {
      const { id } = request.params;

      const deletedUser = await db
        .delete(users)
        .where(eq(users.id, id))
        .returning({
          id: users.id,
        });

      if (deletedUser.length === 0) {
        return sendError("User not found", "NOT_FOUND", reply, 404);
      }

      sendSuccess(
        { id: deletedUser[0].id, deleted: true },
        "User deleted successfully",
        reply,
        200,
      );
    },
  );
}
