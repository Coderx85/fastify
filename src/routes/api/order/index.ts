import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import {
  createOrderInputSchema,
  getAllOrdersSchema,
  getOrderByIdSchema,
  updateOrderSchema,
  addProductToOrderSchema,
  removeProductFromOrderSchema,
} from "@/schema/order.schema";
import {
  orderController,
  getOrderByIdHandler,
  updateOrderHandler,
  addProductToOrderHandler,
  removeProductFromOrderHandler,
  getAllOrdersHandler,
} from "./handler";

/**
 * Order routes
 *
 @GET /api/order                               → Get all orders (with filters)
 @POST /api/order                              → Create a new order with products
 @GET /api/order/:orderId                      → Get order by ID with associated products
 @PUT /api/order/:orderId                      → Update order details (status, address, etc.)
 @DELETE /api/order/:orderId                   → Delete an order
 @POST /api/order/:orderId/products            → Add product to order
 @DELETE /api/order/:orderId/products/:productId → Remove product from order
 */
export default async function ordersRoute(fastify: FastifyInstance) {
  // Create a new order
  // POST /api/order
  fastify.withTypeProvider<ZodTypeProvider>().post("/", {
    schema: createOrderInputSchema,
    handler: orderController.createOrderHandler,
  });

  // Get all orders
  // GET /api/order
  fastify.withTypeProvider<ZodTypeProvider>().get("/", {
    schema: getAllOrdersSchema,
    handler: getAllOrdersHandler.handler,
  });

  // Get order by ID
  // GET /api/order/:orderId
  fastify.withTypeProvider<ZodTypeProvider>().get("/:orderId", {
    schema: getOrderByIdSchema,
    handler: getOrderByIdHandler.handler,
  });

  // Update order
  // PUT /api/order/:orderId
  fastify.withTypeProvider<ZodTypeProvider>().put("/:orderId", {
    schema: updateOrderSchema,
    handler: updateOrderHandler.handler,
  });

  // Add product to order
  // POST /api/order/:orderId/products
  fastify.withTypeProvider<ZodTypeProvider>().post("/:orderId/products", {
    schema: addProductToOrderSchema,
    handler: addProductToOrderHandler.handler,
  });

  // Remove product from order
  // DELETE /api/order/:orderId/products/:productId
  fastify
    .withTypeProvider<ZodTypeProvider>()
    .delete("/:orderId/products/:productId", {
      schema: removeProductFromOrderSchema,
      handler: removeProductFromOrderHandler.handler,
    });
}
