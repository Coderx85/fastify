import { FastifyReply, FastifyRequest } from "fastify";
import { RegisterBody, TAuthUserDTO } from "@/schema/auth.schema";
import { sendError, sendSuccess, hashPassword } from "@/lib";
import {
  userService,
  DuplicateUserError,
  DatabaseError,
} from "@/modules/users/user.service";
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
        createdAt: new Date(),
      });

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
      // Handle duplicate user error
      if (error instanceof DuplicateUserError) {
        return sendError(error.message, "CONFLICT", reply, 409);
      }

      // Handle other database errors
      if (error instanceof DatabaseError) {
        console.error("Database error during registration:", error);
        return sendError(
          "An error occurred while creating your account. Please try again.",
          "INTERNAL_SERVER_ERROR",
          reply,
          500,
        );
      }

      // Handle unexpected errors
      if (error instanceof Error) {
        console.error("Registration error:", error.message);
        return sendError(
          error.message || "Failed to register user",
          "INTERNAL_SERVER_ERROR",
          reply,
          500,
        );
      }

      console.error("Unknown registration error:", error);
      return sendError(
        "An unexpected error occurred during registration",
        "INTERNAL_SERVER_ERROR",
        reply,
        500,
      );
    }
  },
};
