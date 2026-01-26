import { FastifyReply, FastifyRequest } from "fastify";
import { ForgotPasswordBody } from "@/schema/auth.schema";
import { users } from "@/lib/store";
import { generateResetToken } from "@/lib/token";
import { sendSuccess } from "@/lib/response";

export const forgotPasswordHandler = {
  handler: async (
    request: FastifyRequest<{ Body: ForgotPasswordBody }>,
    reply: FastifyReply,
  ) => {
    const { email } = request.body;

    // Find user by email
    const user = Array.from(users.values()).find((u) => u.email === email);

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
    return sendSuccess(data, "MESSAGE SENT SUCCESSFULLY", reply, 200);
  },
};
