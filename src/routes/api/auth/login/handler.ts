import { FastifyReply, FastifyRequest } from "fastify";

import { verifyPassword } from "@/lib/hash";
import { LoginSchemaInput as LoginBody } from "@/schema/auth.schema";
import { sendError, sendSuccess } from "@/lib/response";
import { generateAuthToken } from "@/lib/token";
import { userService } from "@/modules/user.service";
import { IUser } from "@/types/user.definition";

export const loginRouteHandler = {
  handler: async (
    request: FastifyRequest<{ Body: LoginBody }>,
    reply: FastifyReply,
  ) => {
    const { email, password } = request.body;

    let user: IUser | undefined;

    try {
      user = await userService.findByEmail(email, password);
    } catch {
      return sendError("User not found", "USER_NOT_FOUND", reply, 404);
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
