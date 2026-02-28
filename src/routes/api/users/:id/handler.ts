import type { FastifyRequest, FastifyReply } from "fastify";
import { sendError, sendSuccess } from "@/lib";
import {
  CreateUserInput,
  IUserController,
  UpdateUserInput,
} from "@/modules/users/user.definition";
import { orderService } from "@/modules/orders/order.service";
import { userService } from "@/modules/users/user.service";

class UserController implements IUserController {
  async createUserHandler(
    request: FastifyRequest<{ Body: CreateUserInput }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const userData = request.body;

      // Create the user
      const result = await userService.createUser(userData);

      // Send success response
      sendSuccess(result, "User created successfully", reply, 201);
    } catch (error) {
      request.log.error(error);

      return sendError(
        "Failed to create user",
        "INTERNAL_SERVER_ERROR",
        reply,
        500,
      );
    }
  }

  async getUserByIdHandler(
    request: FastifyRequest<{ Params: { userId: number } }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { userId } = request.params;

      const user = await userService.getUserById(userId);
      if (!user) {
        return sendError("User not found", "USER_NOT_FOUND", reply, 404);
      }

      sendSuccess(user, "User retrieved successfully", reply, 200);
    } catch (error) {
      request.log.error(error);

      return sendError(
        "Failed to retrieve user",
        "INTERNAL_SERVER_ERROR",
        reply,
        500,
      );
    }
  }

  async updateUserHandler(
    request: FastifyRequest<{
      Params: { userId: number };
      Body: UpdateUserInput;
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { userId } = request.params;
      const updateData = request.body;

      const updatedUser = await userService.updateUser(userId, updateData);
      if (!updatedUser) {
        return sendError("User not found", "USER_NOT_FOUND", reply, 404);
      }

      sendSuccess(updatedUser, "User updated successfully", reply, 200);
    } catch (error) {
      request.log.error(error);

      return sendError(
        "Failed to update user",
        "INTERNAL_SERVER_ERROR",
        reply,
        500,
      );
    }
  }

  async getOrderByUserIdHandler(
    request: FastifyRequest<{
      Params: { id: number };
      Querystring: { orderId: number };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { id: userId } = request.params;
      const { orderId } = request.query;

      // Fetch the order for the user
      const order = await orderService.getOrderById(orderId, userId);
      if (!order) {
        return sendError(
          "Order not found for this user",
          "ORDER_NOT_FOUND",
          reply,
          404,
        );
      }
      sendSuccess(order, "Order retrieved successfully", reply, 200);
    } catch (error) {
      request.log.error(error);

      return sendError(
        "Failed to retrieve order",
        "INTERNAL_SERVER_ERROR",
        reply,
        500,
      );
    }
  }
}

export const userController = new UserController();
