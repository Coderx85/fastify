import { FastifyReply, FastifyRequest } from "fastify";
import { AuthBody } from "@/schema/auth.schema";
import { users } from "@/db/schema";
import { sendError, sendSuccess, hashPassword } from "@/lib";
import { eq } from "drizzle-orm";
import { db } from "@/db";

export const registerRouteHandler = {
  handler: async (
    request: FastifyRequest<{
      Body: AuthBody;
    }>,
    reply: FastifyReply,
  ) => {
    const { email, password } = request.body;

    // Check if user exists
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    if (existingUsers.length > 0) {
      return sendError("User already exists", "CONFLICT", reply, 409);
    }

    // Create user
    const hashedPassword = hashPassword(password);
    const newUser = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        name: email, // Using email as name for now, as name is not in the auth body
      })
      .returning({
        id: users.id,
        email: users.email,
      });

    // Return success with user data
    return sendSuccess(newUser[0], "User registered successfully", reply, 201);
  },
};
