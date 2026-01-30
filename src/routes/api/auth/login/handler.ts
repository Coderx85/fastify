import { FastifyReply, FastifyRequest } from "fastify";

import { hashPassword, verifyPassword } from "@/lib/hash";
import { AuthBody, LoginBody } from "@/schema/auth.schema";
// import { AuthContext } from "@/types/api";
import { users } from "@/db/schema";
import { sendError, sendSuccess } from "@/lib/response";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";

export const loginRouteHandler = {
  handler: async (
    request: FastifyRequest<{ Body: LoginBody }>,
    reply: FastifyReply,
  ) => {
    const { email, password } = request.body;

    const newHashedPassword = hashPassword(password);

    // Find user
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      return sendError("User not found", "NOT_FOUND", reply, 404);
    }

    // Verify password
    if (!verifyPassword(password, user.password)) {
      return sendError("Invalid credentials", "UNAUTHORIZED", reply, 401);
    }

    const result = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };

    sendSuccess(result.user, "Login successful", reply, 200);
  },
};
