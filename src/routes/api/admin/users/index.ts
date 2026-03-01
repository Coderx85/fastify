import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import { updateUserSchema } from "@/schema/user.schema";
import { userController } from "../../users/:id/handler";
import z from "zod";

export default async function userRoute(fastify: FastifyInstance) {
  // GET /api/admin/users/:id
  fastify.withTypeProvider<ZodTypeProvider>().put("/:id", {
    schema: updateUserSchema,
    handler: userController.updateUserHandler,
  });

  fastify.withTypeProvider<ZodTypeProvider>().get("/", {
    schema: {
      querystring: z.object({
        email: z.string().email().optional(),
      }),
    },
    handler: userController.getAllUsersHandler,
  });
}
