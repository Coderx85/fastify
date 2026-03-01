import type { FastifyReply, FastifyInstance, FastifyRequest } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import {} from "@/modules/orders/order.service";
import { getOrderByUserIdSchema, getUserSchema } from "@/schema/user.schema";
import { userController } from "./handler";

export default async function userRoute(fastify: FastifyInstance) {
  // GET /api/users/:id?orderId=123
  fastify.withTypeProvider<ZodTypeProvider>().get("/", {
    schema: getOrderByUserIdSchema,
    handler: userController.getOrderByUserIdHandler,
  });

  // PUT /api/users/:userId
  fastify.withTypeProvider<ZodTypeProvider>().put("/:userId", {
    schema: getUserSchema,
    handler: userController.updateUserHandler,
  });
}
