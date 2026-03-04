import { FastifyReply, FastifyRequest } from "fastify";
import { sendError, sendSuccess } from "@/lib/response";
// import {
//   CreateOrderBody,
//   GetOrderByIdParams,
//   UpdateOrderBody,
//   UpdateOrderParams,
//   AddProductToOrderBody,
//   AddProductToOrderParams,
//   RemoveProductFromOrderParams,
//   GetAllOrdersQuery,
//   DeleteOrderParams,
// } from "@/schema/order.schema";
import { orderService, OrderService } from "@/modules/orders/order.service";
import {
  IOrder,
  IOrderController,
  IOrderInput,
  IOrderResult,
} from "@/modules/orders/order.definition";
import { getUser } from "@/middleware/auth.middleware";

// Initialize service

class OrderController implements IOrderController {
  private orderService: OrderService = orderService;

  constructor() {
    // bind instance methods so `this` is valid when handlers are passed directly
    this.createOrderHandler = this.createOrderHandler.bind(this);
    this.getOrderByIdHandler = this.getOrderByIdHandler.bind(this);
  }

  async createOrderHandler(
    request: FastifyRequest<{ Body: IOrderInput }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const orderData = request.body;

      const paymentMethod = orderData.paymentMethod || "razorpay"; // default to razorpay if not provided
      if (!paymentMethod) {
        return sendError(
          "BAD_REQUEST",
          "Payment method is required",
          reply,
          400,
        );
      }

      // Validate supported payment methods
      if (!["razorpay", "polar"].includes(paymentMethod)) {
        return sendError(
          "BAD_REQUEST",
          `Unsupported payment method: ${paymentMethod}`,
          reply,
          400,
        );
      }

      const user = await getUser();
      if (!user) {
        return sendError("UNAUTHORIZED", "Unauthorized", reply, 401);
      }

      // Call service with userId and data
      const result = await this.orderService.createOrder(orderData, user.id);

      return sendSuccess(result, "Order created successfully", reply, 201);
    } catch (error) {
      request.log.error(error);

      if (error instanceof Error) {
        const message = error.message;
        if (message.includes("not found") || message.includes("Product")) {
          return sendError("NOT_FOUND", message, reply, 404);
        }
        if (message.includes("validation") || message.includes("required")) {
          return sendError("BAD_REQUEST", message, reply, 400);
        }
      }

      return sendError(
        "INTERNAL_SERVER_ERROR",
        "Failed to create order",
        reply,
        500,
      );
    }
  }

  async getOrderByIdHandler(
    request: FastifyRequest<{ Params: { orderId: number } }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { orderId } = request.params;

      const result = await this.orderService.getOrderById(orderId);

      if (!result) {
        return sendError(
          `Order with ID ${orderId} not found`,
          "NOT_FOUND",
          reply,
          404,
        );
      }

      sendSuccess(result, "Order fetched successfully", reply);
    } catch (error) {
      request.log.error(error);
      sendError("Failed to fetch order", "INTERNAL_SERVER_ERROR", reply, 500);
    }
  }
}

export const orderController = new OrderController();
export { OrderController };

/**
 * Handler for getting an order by ID
 * GET /orders/:orderId
 */
export const getOrderByIdHandler = {
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // TODO: Implement getOrderById method in OrderService
      return sendError("Not implemented yet", "NOT_IMPLEMENTED", reply, 501);
    } catch (error) {
      request.log.error(error);
      return sendError(
        "Failed to fetch order",
        "INTERNAL_SERVER_ERROR",
        reply,
        500,
      );
    }
  },
};

/**
 * Handler for updating an order
 * PUT /orders/:orderId
 */
export const updateOrderHandler = {
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // TODO: Implement updateOrder method in OrderService
      return sendError("Not implemented yet", "NOT_IMPLEMENTED", reply, 501);
    } catch (error) {
      request.log.error(error);
      return sendError(
        "Failed to update order",
        "INTERNAL_SERVER_ERROR",
        reply,
        500,
      );
    }
  },
};

/**
 * Handler for adding a product to an order
 * POST /orders/:orderId/products
 */
export const addProductToOrderHandler = {
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // TODO: Implement addProductToOrder method in OrderService
      return sendError("Not implemented yet", "NOT_IMPLEMENTED", reply, 501);
    } catch (error) {
      request.log.error(error);
      return sendError(
        "Failed to add product to order",
        "INTERNAL_SERVER_ERROR",
        reply,
        500,
      );
    }
  },
};

/**
 * Handler for removing a product from an order
 * DELETE /orders/:orderId/products/:productId
 */
export const removeProductFromOrderHandler = {
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // TODO: Implement removeProductFromOrder method in OrderService
      return sendError("Not implemented yet", "NOT_IMPLEMENTED", reply, 501);
    } catch (error) {
      request.log.error(error);
      return sendError(
        "Failed to remove product from order",
        "INTERNAL_SERVER_ERROR",
        reply,
        500,
      );
    }
  },
};

/**
 * Handler for getting all orders
 * GET /orders
 */
export const getAllOrdersHandler = {
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // TODO: Implement getAllOrders method in OrderService
      return sendError("Not implemented yet", "NOT_IMPLEMENTED", reply, 501);
    } catch (error) {
      request.log.error(error);
      return sendError(
        "Failed to fetch orders",
        "INTERNAL_SERVER_ERROR",
        reply,
        500,
      );
    }
  },
};
