import type { FastifyRequest, FastifyReply } from "fastify";
import { sendError, sendSuccess } from "@/lib";
import {
  CreateUserInput,
  IUserController,
  UpdateUserInput,
} from "@/modules/users/user.definition";
import { orderService } from "@/modules/orders/order.service";
import { userService } from "@/modules/users/user.service";
import { getCauseCode } from "@/lib/error";

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
      Params: { id: number };
      Body: UpdateUserInput;
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { id } = request.params;
      const updateData = request.body;

      const updatedUser = await userService.updateUser(id, updateData);

      sendSuccess(updatedUser, "User updated successfully", reply, 200);
    } catch (error) {
      // Extract error code from cause or directly from the error object
      const code = getCauseCode(error) || (error as any)?.code;

      if (code === "USER_NOT_FOUND" || code === "NOT_FOUND") {
        return sendError("User not found", "USER_NOT_FOUND", reply, 404);
      }

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

      // Fetch the orders for the user
      const orders = await orderService.getOrdersByUserId(orderId, userId);
      if (!orders) {
        return sendError(
          "Order not found for this user",
          "ORDER_NOT_FOUND",
          reply,
          404,
        );
      }
      sendSuccess(orders, "Orders retrieved successfully", reply, 200);
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

  async getUserByEmailHandler(
    request: FastifyRequest<{ Querystring: { email: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      // Implementation for getting user by email

      const { email } = request.query;

      if (!email) {
        return sendError(
          "Email query parameter is required",
          "BAD_REQUEST",
          reply,
          400,
        );
      }

      const user = await userService.findByEmail(email);
      if (!user) {
        return sendError("User not found", "USER_NOT_FOUND", reply, 404);
      }

      return sendSuccess(
        { message: "User retrieved successfully" },
        "User retrieved successfully",
        reply,
        200,
      );
    } catch (error) {
      request.log.error(error);

      return sendError(
        "Failed to retrieve user by email",
        "INTERNAL_SERVER_ERROR",
        reply,
        500,
      );
    }
  }

  async getAllUsersHandler(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      // const { email } = request.query;

      // if (!email) {
      //   const user = await userService.findByEmail(email);
      //   if (!user) {
      //     return sendError("User not found", "USER_NOT_FOUND", reply, 404);
      //   }

      // sendSuccess(user, "User retrieved successfully", reply, 200);
      // } else {
      const users = await userService.getAllUsers();
      sendSuccess(users, "Users retrieved successfully", reply, 200);
      // }
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
}

export const userController = new UserController();
