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
import { OrderService } from "@/modules/order.service";

// Initialize service
const orderService = new OrderService();

/**
 * Handler for creating a new order
 * POST /orders
 */
export const createOrderHandler = {
  handler: async (
    request: FastifyRequest<{ Body: CreateOrderBody }>,
    reply: FastifyReply,
  ) => {
    try {
      const orderData = request.body;

      // Create the order
      const result = await orderService.createOrder(orderData);

      // Send success response
      sendSuccess(result, "Order created successfully", reply, 201);
    } catch (error) {
      request.log.error(error);

      // Check if it's a product not found error
      if (error instanceof Error) {
        return sendError(error.message, "PRODUCT_NOT_FOUND", reply, 404);
      }

      return sendError(
        "Failed to create order",
        "INTERNAL_SERVER_ERROR",
        reply,
        500,
      );
    }
  },
};

/**
 * Handler for getting an order by ID
 * GET /orders/:orderId
 */
export const getOrderByIdHandler = {
  handler: async (
    request: FastifyRequest<{ Params: GetOrderByIdParams }>,
    reply: FastifyReply,
  ) => {
    try {
      const { orderId } = request.params;

      // Get the order
      const result = await orderService.getOrderById(orderId);

      if (!result) {
        return sendError(
          `Order with ID ${orderId} not found`,
          "NOT_FOUND",
          reply,
          404,
        );
      }

      // Send success response
      sendSuccess(result, "Order fetched successfully", reply, 200);
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
  handler: async (
    request: FastifyRequest<{
      Params: UpdateOrderParams;
      Body: UpdateOrderBody;
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const { orderId } = request.params;
      const updateData = request.body;

      // Update the order
      const result = await orderService.updateOrder(orderId, updateData);

      // Send success response
      sendSuccess(result, "Order updated successfully", reply, 200);
    } catch (error) {
      request.log.error(error);

      if (error instanceof Error && error.message.includes("not found")) {
        return sendError(error.message, "NOT_FOUND", reply, 404);
      }

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
  handler: async (
    request: FastifyRequest<{
      Params: AddProductToOrderParams;
      Body: AddProductToOrderBody;
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const { orderId } = request.params;
      const { productId, quantity } = request.body;

      // Add product to order
      const result = await orderService.addProductToOrder(
        orderId,
        productId,
        quantity,
      );

      // Send success response
      sendSuccess(result, "Product added to order successfully", reply, 200);
    } catch (error) {
      request.log.error(error);

      if (error instanceof Error && error.message.includes("not found")) {
        return sendError(error.message, "NOT_FOUND", reply, 404);
      }

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
  handler: async (
    request: FastifyRequest<{ Params: RemoveProductFromOrderParams }>,
    reply: FastifyReply,
  ) => {
    try {
      const { orderId, productId } = request.params;

      // Remove product from order
      const result = await orderService.removeProductFromOrder(
        orderId,
        productId,
      );

      // Send success response
      sendSuccess(
        result,
        "Product removed from order successfully",
        reply,
        200,
      );
    } catch (error) {
      request.log.error(error);

      if (error instanceof Error && error.message.includes("not found")) {
        return sendError(error.message, "NOT_FOUND", reply, 404);
      }

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
  handler: async (
    request: FastifyRequest<{ Querystring: GetAllOrdersQuery }>,
    reply: FastifyReply,
  ) => {
    try {
      const options = request.query;

      // Get all orders
      const result = await orderService.getAllOrders(options);

      // Send success response
      sendSuccess(result, "Orders fetched successfully", reply, 200);
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

/**
 * Handler for deleting an order
 * DELETE /orders/:orderId
 */
export const deleteOrderHandler = {
  handler: async (
    request: FastifyRequest<{ Params: DeleteOrderParams }>,
    reply: FastifyReply,
  ) => {
    try {
      const { orderId } = request.params;

      // Delete the order
      const result = await orderService.deleteOrder(orderId);

      // Send success response
      sendSuccess(result, "Order deleted successfully", reply, 200);
    } catch (error) {
      request.log.error(error);

      if (error instanceof Error && error.message.includes("not found")) {
        return sendError(error.message, "NOT_FOUND", reply, 404);
      }

      return sendError(
        "Failed to delete order",
        "INTERNAL_SERVER_ERROR",
        reply,
        500,
      );
    }
  },
};
