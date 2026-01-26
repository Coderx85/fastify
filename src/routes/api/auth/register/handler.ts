import { FastifyReply, FastifyRequest } from "fastify";
import { AuthBody } from "@/schema/auth.schema";
import { users, userState, sendError, sendSuccess, hashPassword } from "@/lib";

export const registerRouteHandler = {
  handler: async (
    request: FastifyRequest<{
      Body: AuthBody;
    }>,
    reply: FastifyReply,
  ) => {
    const { email, password } = request.body;

    // Check if user exists
    if (users.has(email)) {
      return sendError("User already exists", "CONFLICT", reply, 409);
    }

    // Create user
    const userId = userState.idCounter++;
    const hashedPassword = hashPassword(password);
    users.set(email, { id: userId, email, password: hashedPassword });

    // Return success with user data
    return sendSuccess(
      { id: userId, email },
      "User registered successfully",
      reply,
      201,
    );
  },
};
