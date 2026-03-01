import { FastifyReply, FastifyRequest } from "fastify";
import { sendError, sendSuccess } from "@/lib/response";
import {
  CreateOrderBody,
  GetOrderByIdParams,
  UpdateOrderBody,
  UpdateOrderParams,
  AddProductToOrderBody,
  AddProductToOrderParams,
  RemoveProductFromOrderParams,
  GetAllOrdersQuery,
  DeleteOrderParams,
} from "@/schema/order.schema";
import { OrderService } from "@/modules/orders/order.service";
import {
  IOrder,
  IOrderController,
  IOrderInput,
  IOrderResult,
} from "@/modules/orders/order.definition";

// Initialize service
const orderService = new OrderService();

// /**
//  * Handler for creating a new order
//  * POST /orders
//  */
// export const createOrderHandler = {
//   handler: async (
//     request: FastifyRequest<{ Body: CreateOrderBody }>,
//     reply: FastifyReply,
//   ) => {
//     try {
//       // If the client did not provide a userId, attempt to extract it from
//       // the Bearer token.  This keeps the API usable from authenticated
//       // clients without forcing them to send their own user ID (which could
//       // otherwise be spoofed).
//       const orderData = { ...request.body } as CreateOrderBody;

//       if (!orderData.userId) {
//         const authHeader = request.headers.authorization;
//         if (authHeader && authHeader.startsWith("Bearer ")) {
//           const token = authHeader.slice(7);
//           const { verifyAuthToken } = await import("@/lib/token");
//           const payload = verifyAuthToken(token);
//           if (
//             payload &&
//             typeof payload === "object" &&
//             "id" in payload &&
//             typeof (payload as any).id === "number"
//           ) {
//             orderData.userId = (payload as any).id;
//           }
//         }
//       }

//       if (!orderData.userId) {
//         return sendError(
//           "Unauthorized: missing user ID",
//           "UNAUTHORIZED",
//           reply,
//           401,
//         );
//       }

//       // Create the order
//       const result = await orderService.createOrder(orderData);

//       // Send success response
//       sendSuccess(result, "Order created successfully", reply, 201);
//     } catch (error) {
//       request.log.error(error);

//       // Check if it's a product not found error
//       if (error instanceof Error) {
//         return sendError(error.message, "PRODUCT_NOT_FOUND", reply, 404);
//       }

//       return sendError(
//         "Failed to create order",
//         "INTERNAL_SERVER_ERROR",
//         reply,
//         500,
//       );
//     }
//   },
// };

class OrderController implements IOrderController {
  async createOrderHandler(
    request: FastifyRequest<{ Body: IOrderInput }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const orderData = request.body;

      // Extract userId from request (could come from auth middleware or request body)
      const userId = orderData.userId;

      if (!userId) {
        return sendError("User ID is required", "BAD_REQUEST", reply, 400);
      }

      // Call service with userId and data
      const result = await orderService.createOrder(orderData, userId);

      sendSuccess(result, "Order created successfully", reply, 201);
    } catch (error) {
      request.log.error(error);

      if (error instanceof Error) {
        const message = error.message;
        if (message.includes("not found") || message.includes("Product")) {
          return sendError(message, "NOT_FOUND", reply, 404);
        }
        if (message.includes("validation") || message.includes("required")) {
          return sendError(message, "BAD_REQUEST", reply, 400);
        }
      }

      sendError("Failed to create order", "INTERNAL_SERVER_ERROR", reply, 500);
    }
  }

  async getOrderByIdHandler(
    request: FastifyRequest<{ Params: { orderId: number } }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { orderId } = request.params;

      const result = await orderService.getOrderById(orderId);

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
