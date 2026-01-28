import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import {
  createOrderSchema,
  getOrderByIdSchema,
  updateOrderSchema,
  addProductToOrderSchema,
  removeProductFromOrderSchema,
  getAllOrdersSchema,
  deleteOrderSchema,
} from "@/schema/order.schema";
import {
  createOrderHandler,
  getOrderByIdHandler,
  updateOrderHandler,
  addProductToOrderHandler,
  removeProductFromOrderHandler,
  getAllOrdersHandler,
  deleteOrderHandler,
} from "./handler";

/**
 * Order routes
 *
 @GET /orders                               → Get all orders (with filters)
 @POST /orders                              → Create a new order with products
 @GET /orders/:orderId                      → Get order by ID with associated products
 @PUT /orders/:orderId                      → Update order details (status, address, etc.)
 @DELETE /orders/:orderId                   → Delete an order
 @POST /orders/:orderId/products            → Add product to order
 @DELETE /orders/:orderId/products/:productId → Remove product from order
 */
export default async function ordersRoute(fastify: FastifyInstance) {
  // Get all orders
  // GET /orders
  fastify.withTypeProvider<ZodTypeProvider>().get("/", {
    schema: getAllOrdersSchema,
    handler: getAllOrdersHandler.handler,
  });

  // Create a new order
  // POST /orders
  fastify.withTypeProvider<ZodTypeProvider>().post("/", {
    schema: createOrderSchema,
    handler: createOrderHandler.handler,
  });

  // Get order by ID
  // GET /orders/:orderId
  fastify.withTypeProvider<ZodTypeProvider>().get("/:orderId", {
    schema: getOrderByIdSchema,
    handler: getOrderByIdHandler.handler,
  });

  // Update order
  // PUT /orders/:orderId
  fastify.withTypeProvider<ZodTypeProvider>().put("/:orderId", {
    schema: updateOrderSchema,
    handler: updateOrderHandler.handler,
  });

  // Delete an order
  // DELETE /orders/:orderId
  fastify.withTypeProvider<ZodTypeProvider>().delete("/:orderId", {
    schema: deleteOrderSchema,
    handler: deleteOrderHandler.handler,
  });

  // Add product to order
  // POST /orders/:orderId/products
  fastify.withTypeProvider<ZodTypeProvider>().post("/:orderId/products", {
    schema: addProductToOrderSchema,
    handler: addProductToOrderHandler.handler,
  });

  // Remove product from order
  // DELETE /orders/:orderId/products/:productId
  fastify
    .withTypeProvider<ZodTypeProvider>()
    .delete("/:orderId/products/:productId", {
      schema: removeProductFromOrderSchema,
      handler: removeProductFromOrderHandler.handler,
    });
}
