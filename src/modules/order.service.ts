// import { db } from "@/db";
// import { orders, orderProduct } from "@/db/schema";
// import { eq } from "drizzle-orm";
import { TOrder, TOrderProduct } from "@/db/schema";
import {
  ordersSample,
  orderProductsSample,
  getNextOrderId,
  getNextOrderProductId,
} from "@/sample/orders.sample";
import { productsSample } from "@/sample/products.sample";
import {
  CreateOrderBody,
  OrderWithProducts,
  UpdateOrderBody,
} from "@/schema/order.schema";

export class OrderService {
  /**
   * Create a new order with products
   * @param data Order creation data including products array
   * @returns Created order with associated products
   */
  async createOrder(data: CreateOrderBody): Promise<OrderWithProducts> {
    // Validate that all products exist and calculate total
    let totalAmount = 0;
    const productPrices: Map<number, number> = new Map();

    for (const item of data.products) {
      // Find product in sample data (or DB)
      // const dbProduct = await db
      //   .select()
      //   .from(product)
      //   .where(eq(product.productId, item.productId))
      //   .limit(1);

      const foundProduct = productsSample.find(
        (p) => p.productId === item.productId,
      );

      if (!foundProduct) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }

      productPrices.set(item.productId, foundProduct.price);
      totalAmount += foundProduct.price * item.quantity;
    }

    // Create the order
    const now = new Date();
    const newOrder: TOrder = {
      id: getNextOrderId(),
      userId: data.userId,
      totalAmount,
      status: "processing",
      shippingAddress: data.shippingAddress ?? null,
      paymentMethod: data.paymentMethod ?? null,
      notes: data.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };

    // const [createdOrder] = await db.insert(orders).values({
    //   userId: data.userId,
    //   totalAmount,
    //   status: "processing",
    //   shippingAddress: data.shippingAddress,
    //   paymentMethod: data.paymentMethod,
    //   notes: data.notes,
    // }).returning();

    // Add to sample data
    ordersSample.push(newOrder);

    // Create order products
    const createdOrderProducts: TOrderProduct[] = [];

    for (const item of data.products) {
      const priceAtOrder = productPrices.get(item.productId)!;

      const newOrderProduct: TOrderProduct = {
        id: getNextOrderProductId(),
        orderId: newOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtOrder,
        createdAt: now,
      };

      // const [createdOrderProduct] = await db.insert(orderProduct).values({
      //   orderId: createdOrder.id,
      //   productId: item.productId,
      //   quantity: item.quantity,
      //   priceAtOrder,
      // }).returning();

      orderProductsSample.push(newOrderProduct);
      createdOrderProducts.push(newOrderProduct);
    }

    return {
      order: newOrder,
      products: createdOrderProducts,
    };
  }

  /**
   * Get order by ID with associated products
   * @param orderId Order ID
   * @returns Order with products or null if not found
   */
  async getOrderById(orderId: number): Promise<OrderWithProducts | null> {
    // const [foundOrder] = await db
    //   .select()
    //   .from(orders)
    //   .where(eq(orders.id, orderId))
    //   .limit(1);

    const foundOrder = ordersSample.find((o) => o.id === orderId);

    if (!foundOrder) {
      return null;
    }

    // Get associated products
    // const orderProducts = await db
    //   .select()
    //   .from(orderProduct)
    //   .where(eq(orderProduct.orderId, orderId));

    const orderProducts = orderProductsSample.filter(
      (op) => op.orderId === orderId,
    );

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
    // const userOrders = await db
    //   .select()
    //   .from(orders)
    //   .where(eq(orders.userId, userId));

    const userOrders = ordersSample.filter((o) => o.userId === userId);

    const result: OrderWithProducts[] = [];

    for (const order of userOrders) {
      const orderProducts = orderProductsSample.filter(
        (op) => op.orderId === order.id,
      );
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
    // Find the order
    const orderIndex = ordersSample.findIndex((o) => o.id === orderId);

    if (orderIndex === -1) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    const existingOrder = ordersSample[orderIndex];
    const now = new Date();

    // Update order fields
    const updatedOrder: TOrder = {
      ...existingOrder,
      status: data.status ?? existingOrder.status,
      shippingAddress: data.shippingAddress ?? existingOrder.shippingAddress,
      paymentMethod: data.paymentMethod ?? existingOrder.paymentMethod,
      notes: data.notes ?? existingOrder.notes,
      updatedAt: now,
    };

    // await db
    //   .update(orders)
    //   .set({
    //     status: data.status,
    //     shippingAddress: data.shippingAddress,
    //     paymentMethod: data.paymentMethod,
    //     notes: data.notes,
    //     updatedAt: now,
    //   })
    //   .where(eq(orders.id, orderId));

    // Update in sample data
    ordersSample[orderIndex] = updatedOrder;

    // Get associated products
    const orderProducts = orderProductsSample.filter(
      (op) => op.orderId === orderId,
    );

    return {
      order: updatedOrder,
      products: orderProducts,
    };
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
    // Find the order
    const orderIndex = ordersSample.findIndex((o) => o.id === orderId);

    if (orderIndex === -1) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    // Find the product to get its price
    const foundProduct = productsSample.find((p) => p.productId === productId);

    if (!foundProduct) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    const now = new Date();
    const priceAtOrder = foundProduct.price;

    // Check if product already exists in order
    const existingOrderProductIndex = orderProductsSample.findIndex(
      (op) => op.orderId === orderId && op.productId === productId,
    );

    if (existingOrderProductIndex !== -1) {
      // Update quantity of existing product
      const existingOrderProduct =
        orderProductsSample[existingOrderProductIndex];
      orderProductsSample[existingOrderProductIndex] = {
        ...existingOrderProduct,
        quantity: existingOrderProduct.quantity + quantity,
      };

      // await db
      //   .update(orderProduct)
      //   .set({ quantity: existingOrderProduct.quantity + quantity })
      //   .where(
      //     and(
      //       eq(orderProduct.orderId, orderId),
      //       eq(orderProduct.productId, productId),
      //     ),
      //   );
    } else {
      // Create new order product
      const newOrderProduct: TOrderProduct = {
        id: getNextOrderProductId(),
        orderId,
        productId,
        quantity,
        priceAtOrder,
        createdAt: now,
      };

      // await db.insert(orderProduct).values({
      //   orderId,
      //   productId,
      //   quantity,
      //   priceAtOrder,
      // });

      orderProductsSample.push(newOrderProduct);
    }

    // Recalculate total amount
    const orderProducts = orderProductsSample.filter(
      (op) => op.orderId === orderId,
    );
    const newTotalAmount = orderProducts.reduce(
      (sum, op) => sum + op.priceAtOrder * op.quantity,
      0,
    );

    // Update order
    const existingOrder = ordersSample[orderIndex];
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
      products: orderProducts,
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
    const existingOrder = ordersSample[orderIndex];
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
