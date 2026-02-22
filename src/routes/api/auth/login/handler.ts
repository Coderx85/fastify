import { FastifyReply, FastifyRequest } from "fastify";

import { verifyPassword } from "@/lib/hash";
import { LoginBody } from "@/schema/auth.schema";
import { users } from "@/db/schema";
import { sendError, sendSuccess } from "@/lib/response";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { generateAuthToken } from "@/lib/token";

export const loginRouteHandler = {
  handler: async (
    request: FastifyRequest<{ Body: LoginBody }>,
    reply: FastifyReply,
  ) => {
    const { email, password } = request.body;

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
      token: generateAuthToken({ id: user.id, email: user.email }),
    };

    sendSuccess(result, "Login successful", reply, 200);
  },
};
