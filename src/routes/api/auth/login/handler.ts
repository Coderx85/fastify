import { FastifyReply, FastifyRequest } from "fastify";

import { verifyPassword } from "@/lib/hash";
import { AuthBody } from "@/schema/auth.schema";
import { AuthContext } from "@/types/api";
import { users } from "@/db/schema";
import { sendError, sendSuccess } from "@/lib/response";
import { eq } from "drizzle-orm";
import { db } from "@/db";

export const loginRouteHandler = {
  handler: async (
    request: FastifyRequest<{ Body: AuthBody }>,
    reply: FastifyReply,
  ) => {
    const { email, password } = request.body;

    // Find user
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    const user = existingUsers[0];

    if (!user) {
      return sendError("User not found", "NOT_FOUND", reply, 404);
    }

    // Verify password
    if (!verifyPassword(password, user.password)) {
      return sendError("Invalid credentials", "UNAUTHORIZED", reply, 401);
    }

    // Return success with auth token
    const authContext: AuthContext = {
      user: { id: user.id, email: user.email },
      isAuthenticated: true,
    };

    const result = {
      token: "dummy-jwt-token",
      user: authContext.user,
    };

    sendSuccess(result, "Login successful", reply, 200);
  },
};
