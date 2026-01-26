import { FastifyReply, FastifyRequest } from "fastify";
import { ResetPasswordBody } from "@/schema/auth.schema";
import { users } from "@/lib/store";
import { validateResetToken, deleteResetToken } from "@/lib/token";
import { hashPassword } from "@/lib/hash";
import { sendSuccess, sendError } from "@/lib/response";

export const resetPasswordHandler = {
  handler: async (
    request: FastifyRequest<{ Body: ResetPasswordBody }>,
    reply: FastifyReply,
  ) => {
    const { token, password } = request.body;

    const userId = validateResetToken(token);

    if (!userId) {
      return sendError("INVALID OR EXPIRED TOKEN", "unauthorized", reply, 401);
    }

    const user = Array.from(users.values()).find((u) => u.id === userId);

    if (!user) {
      // This case should be rare if the token is valid
      return sendError("USER NOT FOUND", "not_found", reply, 404);
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update user's password
    users.set(user.email, { ...user, password: hashedPassword });

    // Delete the token so it can't be reused
    deleteResetToken(token);

    return sendSuccess(
      { passwordReset: true },
      "PASSWORD RESET SUCCESSFUL",
      reply,
      200,
    );
  },
};
