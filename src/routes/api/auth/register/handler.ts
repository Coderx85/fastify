import { FastifyReply, FastifyRequest } from "fastify";
import { RegisterBody } from "@/schema/auth.schema";
import { users } from "@/db/schema";
import { sendError, sendSuccess, hashPassword } from "@/lib";
import { eq } from "drizzle-orm";
import { db } from "@/db";

export const registerRouteHandler = {
  handler: async (
    request: FastifyRequest<{
      Body: RegisterBody;
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const { email, password, name } = request.body;

      // Check if user exists
      const [existingUsers] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (existingUsers) {
        return sendError("User already exists", "USER_EXISTS", reply, 409);
      }

      // Create user
      const hashedPassword = hashPassword(password);

      const [newUser] = await db
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          name,
        })
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
        });

      if (!newUser) {
        throw new Error("User creation failed");
      }

      // Return success with user data
      return sendSuccess(newUser, "User registered successfully", reply, 201);
    } catch (error: unknown) {
      console.error("Registration error:", error);
      return sendError(
        "Internal server error",
        "INTERNAL_SERVER_ERROR",
        reply,
        500,
      );
    }
  },
};
