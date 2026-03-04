import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import {} from "@/modules/orders/order.service";
import {
  deleteUserResponseSchema,
  getOrderByUserIdSchema,
  getUserSchema,
} from "@/schema/user.schema";
import { userController } from "./handler";

export default async function userRoute(fastify: FastifyInstance) {
  // GET /api/users/:id?orderId=123
  fastify.withTypeProvider<ZodTypeProvider>().get("/", {
    schema: getOrderByUserIdSchema,
    handler: userController.getOrderByUserIdHandler,
  });

  // PUT /api/users/:userId
  // fastify.withTypeProvider<ZodTypeProvider>().put("/", {
  //   schema: getUserSchema,
  //   handler: userController.updateUserHandler,
  // });

  fastify.withTypeProvider<ZodTypeProvider>().delete("/:id", {
    schema: deleteUserResponseSchema,
    handler: userController.deleteUserHandler,
  });
}
