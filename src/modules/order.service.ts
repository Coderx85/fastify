import { db } from "@/db";
import { orders, orderProduct, product, addresses } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { TOrder, TOrderProduct } from "@/db/schema";
// import { ordersSample, orderProductsSample } from "@/sample/orders.sample";
import {
  CreateOrderBody,
  OrderWithProducts,
  UpdateOrderBody,
} from "@/schema/order.schema";
import { productService } from "./product.service";
import { CurrencyEnum, IProducts } from "@/types/payment";

interface IOrderService {
  createOrder(data: TCreateOrder): Promise<OrderWithProducts>;
  getOrderById(orderId: number): Promise<OrderWithProducts | null>;
  getOrdersByUserId(userId: number): Promise<OrderWithProducts[]>;
  updateOrder(
    orderId: number,
    data: UpdateOrderBody,
  ): Promise<OrderWithProducts>;
  addProductToOrder(
    orderId: number,
    productId: number,
    quantity?: number,
  ): Promise<OrderWithProducts>;
  removeProductFromOrder(
    orderId: number,
    productId: number,
  ): Promise<OrderWithProducts>;
  getAllOrders(options?: {
    userId?: number;
    status?: "processing" | "delivered" | "cancelled";
    limit?: number;
    offset?: number;
  }): Promise<{ orders: OrderWithProducts[]; total: number }>;
}

type TPaymentMethod = "razorpay" | "polar";

type TCreateOrder = CreateOrderBody & {
  method: TPaymentMethod;
};

type mapObject = {
  [key in TPaymentMethod]: CurrencyEnum;
};

const mapPaymentMethodToCurrency = Object.freeze({
  razorpay: "usd",
  polar: "inr",
}) as mapObject;

type getOrderType = {
  options?: {
    id?: number;
    userId?: number;
  };
};

export class OrderService implements IOrderService {
  /**
   * Create a new order with products
   * @param data Order creation data including products array
   * @returns Created order with associated products
   */

  private async getOrder({ options }: getOrderType) {
    let whereCondition = [];

    if (options?.id) {
      whereCondition.push(eq(orders.id, options.id));
    }

    if (options?.userId) {
      whereCondition.push(eq(orders.userId, options.userId));
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(and(...whereCondition))
      .limit(1);

    if (!order) {
      throw new Error(`Order with ID ${options?.id} not found`);
    }

    return order;
  }

  private async checkProductsExist(
    products: { productId: number; quantity: number }[],
  ): Promise<boolean> {
    for (const item of products) {
      const [foundProduct] = await db
        .select()
        .from(product)
        .where(eq(product.productId, item.productId))
        .limit(1);

      if (!foundProduct) {
        return false;
      }
    }

    return true;
  }

  /**
   *
   * @param data
   * @returns
   */
  async createOrder(data: TCreateOrder) {
    if (typeof data.userId !== "number") {
      throw new Error("userId is required to create order");
    }

    const { method } = data;
    const orderCurrency: CurrencyEnum = mapPaymentMethodToCurrency[method];

    let totalAmount = 0;
    const productDetails: IProducts[] = [];

    for (const item of data.products) {
      // Fetch product price in the specific order currency
      const foundProduct = await productService.getProductById(
        item.productId,
        orderCurrency,
      );

      totalAmount += foundProduct.price * item.quantity;
      productDetails.push(foundProduct);
    }

    const [shippingAddress] = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, data.userId));

    const [createdOrder] = await db
      .insert(orders)
      .values({
        billingAddressId: shippingAddress.id,
        shippingAddressId: shippingAddress.id,
        totalAmountCurrency: orderCurrency,
        userId: data.userId!,
        totalAmount: productService.convertToPaises(totalAmount), // Store total amount in base units (paises/cents)
        status: "processing",
        paymentMethod: data.method,
        notes: data.notes,
        createdAt: new Date(),
      })
      .returning();

    // Insert order products
    for (const item of data.products) {
      const productPriceInOrderCurrency = productDetails.find(
        (p) => p.productId === item.productId,
      )?.price;

      if (productPriceInOrderCurrency === undefined) {
        throw new Error(
          `Price for product ${item.productId} not found in ${orderCurrency}`,
        );
      }

      await db.insert(orderProduct).values({
        orderId: createdOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtOrder: productService.convertToPaises(
          productPriceInOrderCurrency,
        ), // Store price at order time in base units
      });
    }

    return {
      order: createdOrder,
      products: [], // You might want to fetch and populate this more thoroughly
    };
  }

  /**
   * Get order by ID with associated products
   * @param orderId Order ID
   * @returns Order with products or null if not found
   */
  async getOrderById(orderId: number) {
    const foundOrder = await this.getOrder({
      options: {
        id: orderId,
      },
    });

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
  async getOrdersByUserId(userId: number) {
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
      const foundOrder = await this.getOrder({
        options: {
          id: orderId,
        },
      });

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

      const [shippingAddressId] = await db
        .select({
          shippingAddressId: addresses.id,
        })
        .from(addresses)
        .where(
          and(
            eq(addresses.id, foundOrder.shippingAddressId),
            eq(addresses.addressType, "shipping"),
          ),
        );

      const [billingAddressId] = await db
        .select({
          billingAddressId: addresses.id,
        })
        .from(addresses)
        .where(
          and(
            eq(addresses.id, foundOrder.billingAddressId),
            eq(addresses.addressType, "billing"),
          ),
        );

      // Update order fields
      const updatedOrder: TOrder = {
        ...foundOrder,
        status: data.status ?? foundOrder.status,
        shippingAddressId: shippingAddressId.shippingAddressId,
        billingAddressId: billingAddressId.billingAddressId,
        paymentMethod: foundOrder.paymentMethod,
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
          shippingAddressId: foundOrder.shippingAddressId,
          billingAddressId: foundOrder.billingAddressId,
          paymentMethod: foundOrder.paymentMethod,
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
    // Fetch product price in the order's currency
    const foundProduct = await productService.getProductById(
      productId,
      foundOrder.totalAmountCurrency,
    );

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
    const { order, products } = await this.getOrderById(orderId);

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    // Status Guard: Cannot remove products from delivered or cancelled orders
    if (order.status === "delivered" || order.status === "cancelled") {
      throw new Error(
        `Cannot remove products from an order that is '${order.status}'`,
      );
    }

    // Check if the product exists in the order
    await this.checkProductsExist([{ productId, quantity: 1 }]);

    const now = new Date();

    // Remove the product from the order and reextract remaining products to recalculate total
    const remainingProducts: TOrderProduct[] = await db.transaction(
      async (tx) => {
        const [deletedOrderProduct] = await tx
          .select()
          .from(orderProduct)
          .where(
            and(
              eq(orderProduct.orderId, orderId),
              eq(orderProduct.productId, productId),
            ),
          )
          .limit(1);

        if (!deletedOrderProduct) {
          throw new Error(
            `Product with ID ${productId} not found in order ${orderId}`,
          );
        }

        const products = await tx
          .delete(orderProduct)
          .where(eq(orderProduct.id, deletedOrderProduct.id));

        if (products)
          throw new Error(
            `Failed to delete product with ID ${productId} from order ${orderId}`,
          );

        return products;
      },
    );

    const newTotalAmount = remainingProducts.reduce(
      (sum, op) => sum + op.priceAtOrder * op.quantity,
      0,
    );

    // Update order
    const updatedOrder: TOrder = {
      ...order,
      totalAmount: newTotalAmount,
      updatedAt: now,
    };

    const [updatedOrderResult] = await db
      .update(orders)
      .set({ totalAmount: newTotalAmount, updatedAt: now })
      .where(eq(orders.id, orderId))
      .returning();

    return {
      order: updatedOrderResult,
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
  }) {
    const { userId, status, limit = 10, offset = 0 } = options || {};
    const whereConditions = [];

    if (userId) {
      whereConditions.push(eq(orders.userId, userId));
    }
    if (status) {
      whereConditions.push(eq(orders.status, status));
    }

    const ordersQuery = db
      .select()
      .from(orders)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .limit(limit)
      .offset(offset);

    const totalQuery = db
      .select({ count: db.$count(orders.id) })
      .from(orders)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const [totalResult] = await totalQuery;
    const total = Number(totalResult?.count) || 0;

    const ordersResults = await ordersQuery;

    const result: OrderWithProducts[] = [];

    for (const order of ordersResults) {
      const orderProducts = await db
        .select()
        .from(orderProduct)
        .where(eq(orderProduct.orderId, order.id));

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
   * Check if an order exists by ID
   * @param orderId Order ID to check existence
   */
  async orderRecord(orderId: number) {
    const order = await this.getOrderById(orderId);

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }
  }
}
