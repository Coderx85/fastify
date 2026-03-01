import { FastifyReply, FastifyRequest } from "fastify";

import { verifyPassword } from "@/lib/hash";
import { LoginSchemaInput as LoginBody } from "@/schema/auth.schema";
import { sendError, sendSuccess } from "@/lib/response";
import { generateAuthToken } from "@/lib/token";
import { userService } from "@/modules/users/user.service";
import { IUser } from "@/modules/users/user.definition";

export const loginRouteHandler = {
  handler: async (
    request: FastifyRequest<{ Body: LoginBody }>,
    reply: FastifyReply,
  ) => {
    const { email, password } = request.body;

    try {
      let user: IUser | null = null;

      user = await userService.findUserForAuth(email);

      if (!user) {
        return sendError("User not found", "USER_NOT_FOUND", reply, 404);
      }

      // verify provided password against the stored hash
      if (!verifyPassword(password, user.password)) {
        return sendError(
          "Invalid email or password",
          "INVALID_CREDENTIALS",
          reply,
          401,
        );
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
    } catch (error: any) {
      return sendError("User not found", "USER_NOT_FOUND", reply, 404);
    }
  },
};
