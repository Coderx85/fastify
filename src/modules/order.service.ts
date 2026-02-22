import { db } from "@/db";
import { orders, orderProduct, product } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { TOrder, TOrderProduct } from "@/db/schema";
import { ordersSample, orderProductsSample } from "@/sample/orders.sample";
import {
  CreateOrderBody,
  OrderWithProducts,
  UpdateOrderBody,
} from "@/schema/order.schema";
import { productService } from "./product.service";
import { IProducts } from "@/types/payment";

export class OrderService {
  /**
   * Create a new order with products
   * @param data Order creation data including products array
   * @returns Created order with associated products
   */
  async createOrder(data: CreateOrderBody): Promise<OrderWithProducts> {
    // Ensure we have a userId before proceeding – the handler is responsible
    // for populating this from the auth token.  At compile time the type is
    // optional, so we guard and then assert to satisfy the Drizzle insert
    // signature.
    if (typeof data.userId !== "number") {
      throw new Error("userId is required to create order");
    }

    // Get product prices to calculate total amount

    // const productIds = data.products.map((p) => p.productId)

    let totalAmount = 0;
    const productDetails: IProducts[] = [];

    // Find the product to get its price
    for (const item of data.products) {
      const foundProduct = await productService.getProductById(item.productId);

      totalAmount += foundProduct.price * item.quantity;
      productDetails.push(foundProduct);
    }

    const [createdOrder] = await db
      .insert(orders)
      .values({
        userId: data.userId!,
        totalAmount, // store total amount in Paises
        status: "processing",
        shippingAddress: data.shippingAddress,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
      })
      .returning();

    // Insert order products
    for (const item of data.products) {
      await db.insert(orderProduct).values({
        orderId: createdOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtOrder: productDetails.find((p) => p.productId === item.productId)
          ?.price as number, // store price at order time in Paises
      });
    }

    return {
      order: createdOrder,
      products: [],
    };
  }

  /**
   * Get order by ID with associated products
   * @param orderId Order ID
   * @returns Order with products or null if not found
   */
  async getOrderById(orderId: number): Promise<OrderWithProducts | null> {
    const [foundOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    // Get associated products
    const orderProducts = await db
      .select()
      .from(orderProduct)
      .where(eq(orderProduct.orderId, orderId));

    return {
      order: foundOrder,
      products: orderProducts,
    };
  }

  /**
   * Get all orders for a user
   * @param userId User ID
   * @returns Array of orders with products
   */
  async getOrdersByUserId(userId: number): Promise<OrderWithProducts[]> {
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId));

    const result: OrderWithProducts[] = [];

    for (const order of userOrders) {
      const orderProducts = await db
        .select()
        .from(orderProduct)
        .where(eq(orderProduct.orderId, order.id));

      result.push({
        order,
        products: orderProducts,
      });
    }

    return result;
  }

  /**
   * Update order details (status, shippingAddress, paymentMethod, notes)
   * @param orderId Order ID
   * @param data Update data
   * @returns Updated order with products
   */
  async updateOrder(
    orderId: number,
    data: UpdateOrderBody,
  ): Promise<OrderWithProducts> {
    try {
      // Find the order
      const [foundOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!foundOrder) {
        throw new Error(`Order with ID ${orderId} not found`, {
          cause: {
            STATUS_CODES: 404,
          },
        });
      }

      // Status Guard: Cannot update cancelled orders
      if (foundOrder.status === "cancelled") {
        throw new Error(`Cannot update an order with status 'cancelled'`);
      }

      const now = new Date();

      // Update order fields
      const updatedOrder: TOrder = {
        ...foundOrder,
        status: data.status ?? foundOrder.status,
        shippingAddress: data.shippingAddress ?? foundOrder.shippingAddress,
        paymentMethod: data.paymentMethod ?? foundOrder.paymentMethod,
        notes: data.notes ?? foundOrder.notes,
        updatedAt: now,
      };

      const orderProducts = await db
        .select()
        .from(orderProduct)
        .where(eq(orderProduct.orderId, orderId));

      await db
        .update(orders)
        .set({
          status: data.status,
          shippingAddress: data.shippingAddress,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          updatedAt: now,
        })
        .where(eq(orders.id, orderId));

      return {
        order: updatedOrder,
        products: orderProducts,
      };
    } catch (error: unknown) {
      throw new Error("An unknown error occurred", {
        cause: error,
      });
    }
  }

  /**
   * Add a product to an existing order
   * @param orderId Order ID
   * @param productId Product ID
   * @param quantity Quantity to add
   * @returns Updated order with products
   */
  async addProductToOrder(
    orderId: number,
    productId: number,
    quantity: number = 1,
  ): Promise<OrderWithProducts> {
    // Find order in DB
    const [foundOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!foundOrder) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    // Status Guard
    if (
      foundOrder.status === "delivered" ||
      foundOrder.status === "cancelled"
    ) {
      throw new Error(
        `Cannot add products to an order that is '${foundOrder.status}'`,
      );
    }

    // Find product by external productId (matches order_product.productId FK)
    const [foundProduct] = await db
      .select()
      .from(product)
      .where(eq(product.productId, productId))
      .limit(1);

    if (!foundProduct) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    const now = new Date();

    // Use a transaction to keep order and order_product consistent
    await db.transaction(async (tx) => {
      const [existingOrderProduct] = await tx
        .select()
        .from(orderProduct)
        .where(
          and(
            eq(orderProduct.orderId, orderId),
            eq(orderProduct.productId, productId),
          ),
        )
        .limit(1);

      if (existingOrderProduct) {
        await tx
          .update(orderProduct)
          .set({ quantity: existingOrderProduct.quantity + quantity })
          .where(eq(orderProduct.id, existingOrderProduct.id));
      } else {
        await tx.insert(orderProduct).values({
          orderId,
          productId,
          quantity,
          priceAtOrder: foundProduct.price,
        });
      }

      const orderProducts = await tx
        .select()
        .from(orderProduct)
        .where(eq(orderProduct.orderId, orderId));

      const newTotalAmount = orderProducts.reduce(
        (sum, op) => sum + op.priceAtOrder * op.quantity,
        0,
      );

      await tx
        .update(orders)
        .set({ totalAmount: newTotalAmount, updatedAt: now })
        .where(eq(orders.id, orderId));
    });

    // Return updated order + products
    const [updatedOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    const orderProducts = await db
      .select()
      .from(orderProduct)
      .where(eq(orderProduct.orderId, orderId));

    return {
      order: updatedOrder as TOrder,
      products: orderProducts as TOrderProduct[],
    };
  }

  /**
   * Remove a product from an order
   * @param orderId Order ID
   * @param productId Product ID to remove
   * @returns Updated order with products
   */
  async removeProductFromOrder(
    orderId: number,
    productId: number,
  ): Promise<OrderWithProducts> {
    // Find the order
    const orderIndex = ordersSample.findIndex((o) => o.id === orderId);

    if (orderIndex === -1) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    const existingOrder = ordersSample[orderIndex];

    // Status Guard: Cannot remove products from delivered or cancelled orders
    if (
      existingOrder.status === "delivered" ||
      existingOrder.status === "cancelled"
    ) {
      throw new Error(
        `Cannot remove products from an order that is '${existingOrder.status}'`,
      );
    }

    // Find the order product
    const orderProductIndex = orderProductsSample.findIndex(
      (op) => op.orderId === orderId && op.productId === productId,
    );

    if (orderProductIndex === -1) {
      throw new Error(
        `Product with ID ${productId} not found in order ${orderId}`,
      );
    }

    // Remove the order product
    orderProductsSample.splice(orderProductIndex, 1);

    // await db
    //   .delete(orderProduct)
    //   .where(
    //     and(
    //       eq(orderProduct.orderId, orderId),
    //       eq(orderProduct.productId, productId),
    //     ),
    //   );

    const now = new Date();

    // Recalculate total amount
    const remainingProducts = orderProductsSample.filter(
      (op) => op.orderId === orderId,
    );
    const newTotalAmount = remainingProducts.reduce(
      (sum, op) => sum + op.priceAtOrder * op.quantity,
      0,
    );

    // Update order
    const updatedOrder: TOrder = {
      ...existingOrder,
      totalAmount: newTotalAmount,
      updatedAt: now,
    };

    // await db
    //   .update(orders)
    //   .set({ totalAmount: newTotalAmount, updatedAt: now })
    //   .where(eq(orders.id, orderId));

    ordersSample[orderIndex] = updatedOrder;

    return {
      order: updatedOrder,
      products: remainingProducts,
    };
  }

  /**
   * Get all orders with optional filters
   * @param options Filter options (userId, status, limit, offset)
   * @returns Array of orders with products and total count
   */
  async getAllOrders(options?: {
    userId?: number;
    status?: "processing" | "delivered" | "cancelled";
    limit?: number;
    offset?: number;
  }): Promise<{ orders: OrderWithProducts[]; total: number }> {
    const { userId, status, limit = 10, offset = 0 } = options || {};

    // Filter orders
    // const query = db.select().from(orders);
    // if (userId) query.where(eq(orders.userId, userId));
    // if (status) query.where(eq(orders.status, status));
    // const allOrders = await query.limit(limit).offset(offset);

    let filteredOrders = [...ordersSample];

    // Apply filters
    if (userId !== undefined) {
      filteredOrders = filteredOrders.filter((o) => o.userId === userId);
    }
    if (status !== undefined) {
      filteredOrders = filteredOrders.filter((o) => o.status === status);
    }

    const total = filteredOrders.length;

    // Apply pagination
    const paginatedOrders = filteredOrders.slice(offset, offset + limit);

    // Get products for each order
    const result: OrderWithProducts[] = [];

    for (const order of paginatedOrders) {
      const orderProducts = orderProductsSample.filter(
        (op) => op.orderId === order.id,
      );
      result.push({
        order,
        products: orderProducts,
      });
    }

    return {
      orders: result,
      total,
    };
  }

  /**
   * Delete an order and its associated products
   * @param orderId Order ID
   * @returns Deletion confirmation
   */
  async deleteOrder(
    orderId: number,
  ): Promise<{ deleted: boolean; orderId: number }> {
    // Find the order
    const orderIndex = ordersSample.findIndex((o) => o.id === orderId);

    if (orderIndex === -1) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    // Delete associated order products first
    // await db
    //   .delete(orderProduct)
    //   .where(eq(orderProduct.orderId, orderId));

    // Remove all order products for this order
    for (let i = orderProductsSample.length - 1; i >= 0; i--) {
      if (orderProductsSample[i].orderId === orderId) {
        orderProductsSample.splice(i, 1);
      }
    }

    // Delete the order
    // await db.delete(orders).where(eq(orders.id, orderId));

    ordersSample.splice(orderIndex, 1);

    return {
      deleted: true,
      orderId,
    };
  }
}
