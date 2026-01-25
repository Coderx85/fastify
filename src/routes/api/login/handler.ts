import { FastifyReply, FastifyRequest } from "fastify";
import { users } from "../../../lib/store";
import { AuthBody } from "../../../schema/auth";
import { verifyPassword } from "@/lib/hash";
import { AuthContext } from "@/types/auth.t";

export const loginRouteHandler = {
  handler: async (
    request: FastifyRequest<{ Body: AuthBody }>,
    reply: FastifyReply,
  ) => {
    const { email, password } = request.body;

    // Find user
    const user = users.get(email);
    if (!user) {
      reply
        .status(401)
        .send({ status: "error", message: "Invalid credentials" });
      return;
    }

    // Verify password
    if (!verifyPassword(password, user.password)) {
      reply.status(401);
      return { status: "error", message: "Invalid credentials" };
    }

    // Return success with auth token
    const authContext: AuthContext = {
      user: { id: user.id, email: user.email },
      isAuthenticated: true,
    };

    return {
      status: "success",
      message: "Login successful",
      data: {
        token: Buffer.from(JSON.stringify(authContext)).toString("base64"),
        user: { id: user.id, email: user.email },
      },
    };
  },
};
