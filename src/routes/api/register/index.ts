import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { users, userState } from "../../../lib/store.js";
import { registerSchema } from "../../../schema/auth.js";

// Simple password hashing (for demo only)
const hashPassword = (password: string): string =>
  Buffer.from(password).toString("base64");

export default async function registerRoute(fastify: FastifyInstance) {
  fastify.withTypeProvider<ZodTypeProvider>().post(
    "/",
    {
      schema: registerSchema,
    },
    async (request, reply) => {
      const { email, password } = request.body;

      // Check if user exists
      if (users.has(email)) {
        reply.status(409);
        return { status: "error", message: "User already exists" };
      }

      // Create user
      const userId = userState.idCounter++;
      const hashedPassword = hashPassword(password);
      users.set(email, { id: userId, email, password: hashedPassword });

      // Return success with user data
      return {
        status: "success",
        message: "User registered successfully",
        data: { id: userId, email },
      };
    },
  );
}
