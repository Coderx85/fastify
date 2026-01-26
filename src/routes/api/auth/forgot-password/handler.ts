import { FastifyReply, FastifyRequest } from "fastify";
import { ForgotPasswordBody } from "@/schema/auth.schema";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateResetToken } from "@/lib/token";
import { sendSuccess } from "@/lib/response";

export const forgotPasswordHandler = {
  handler: async (
    request: FastifyRequest<{ Body: ForgotPasswordBody }>,
    reply: FastifyReply,
  ) => {
    const { email } = request.body;
    const { db } = request.server;

    // Find user by email
    const foundUsers = await db.select().from(users).where(eq(users.email, email));
    const user = foundUsers[0];

    if (user) {
      // Generate a reset token
      const token = generateResetToken(user.id);

      // In a real application, you would send an email with the reset link.
      // For this example, we'll just log the token.
      console.log(`Password reset token for ${email}: ${token}`);
    } else {
      // To prevent user enumeration attacks, we don't reveal if the user was found or not.
      // We can log that an attempt was made for a non-existent user for monitoring purposes.
      console.log(`Password reset attempt for non-existent user: ${email}`);
    }

    const data = {
      emailSent: true,
    };

    // Always send a generic success message.
    sendSuccess(data, "MESSAGE SENT SUCCESSFULLY", reply, 200);
  },
};