import { FastifyReply, FastifyRequest } from "fastify";
import { RegisterBody, TAuthUserDTO } from "@/schema/auth.schema";
import { sendError, sendSuccess, hashPassword } from "@/lib";
import { userService } from "@/modules/user.service";
import { generateAuthToken } from "@/lib/token";

export const registerRouteHandler = {
  handler: async (
    request: FastifyRequest<{
      Body: RegisterBody;
    }>,
    reply: FastifyReply,
  ) => {
    const { email, password, name, contact } = request.body;
    try {
      // Create user
      const hashedPassword = hashPassword(password);

      // Check if user already exists
      const newUser = await userService.createUser({
        name,
        email,
        password: hashedPassword,
        contact,
      });

      if (!newUser) {
        throw new Error("User creation failed");
      }

      const token = generateAuthToken({ id: newUser.id, email: newUser.email });

      const userDTO: TAuthUserDTO = {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
        token,
      };

      // Return success with user data
      return sendSuccess(userDTO, "User registered successfully", reply, 201);
    } catch (error: unknown) {
      console.error("Registration error:", error);
      return sendError(
        "Internal server error",
        "INTERNAL_SERVER_ERROR",
        reply,
        500,
      );
    }
  },
};
