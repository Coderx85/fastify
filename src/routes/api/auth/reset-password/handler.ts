import { FastifyReply, FastifyRequest } from "fastify";
import { ResetPasswordBody } from "@/schema/auth.schema";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validateResetToken, deleteResetToken } from "@/lib/token";
import { hashPassword } from "@/lib/hash";
import { sendSuccess, sendError } from "@/lib/response";
import { db } from "@/db";

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

    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    const user = foundUsers[0];

    if (!user) {
      // This case should be rare if the token is valid
      return sendError("USER NOT FOUND", "not_found", reply, 404);
    }

    // Hash the new password
    const hashedPassword = hashPassword(password);

    // Update user's password
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));

    // Delete the token so it can't be reused
    deleteResetToken(token);

    sendSuccess(
      { passwordReset: true },
      "PASSWORD RESET SUCCESSFUL",
      reply,
      200,
    );
  },
};
