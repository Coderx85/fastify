import { db, dbPool } from "@/db";
import {
  ordersTable,
  addressesTable,
  orderProductTable,
  productsPriceTables,
  productsTable,
  TCurrency,
  TOrder,
} from "@/db/schema";
import { ProductService } from "../products/product.service";
import {
  IOrderService,
  IOrderResult,
  IOrderInput,
  IOrderItemOutput,
  IAddressOutput,
  IOrderPricing,
  OrderValidationError,
  InvalidProductError,
  InsufficientAddressError,
  TCurrency as DefinitionCurrency,
  OStatusType,
  getAllOrdersOptions,
} from "./order.definition";
import {
  currencyService,
  type PaymentMethod,
  type CurrencyType,
} from "@/modules/currency/currency.service";
import { eq, and, inArray } from "drizzle-orm";

type findOrderOptions = getAllOrdersOptions & {
  orderId?: number;
};

type findOrderResponse = {
  orders: IOrderResult[];
  firstOrder: IOrderResult;
};

export class OrderService implements IOrderService {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  /**
   * Convert price from one currency to another using CurrencyService
   */
  private async convertPrice(
    amount: number,
    from: DefinitionCurrency,
    to: DefinitionCurrency,
  ): Promise<{ amount: number; rate: number }> {
    if (from === to) {
      return { amount, rate: 1 };
    }

    const result = await currencyService.convertCurrency(
      amount,
      from as CurrencyType,
      to as CurrencyType,
    );

    return {
      amount: result.convertedAmount,
      rate: result.exchangeRate,
    };
  }

  /**
   * Validate order input data
   */
  private validateOrderInput(data: IOrderInput): void {
    if (!data.userId) {
      throw new OrderValidationError("User ID is required");
    }

    if (!data.paymentMethod) {
      throw new OrderValidationError("Payment method is required");
    }

    if (!["razorpay", "polar"].includes(data.paymentMethod)) {
      throw new OrderValidationError(
        "Payment method must be 'razorpay' or 'polar'",
      );
    }

    if (!data.shippingAddress) {
      throw new InsufficientAddressError("Shipping address is required");
    }

    if (!Array.isArray(data.products) || data.products.length === 0) {
      throw new OrderValidationError("At least one product is required");
    }

    // Validate each product
    for (const product of data.products) {
      if (!product.productId || product.productId <= 0) {
        throw new OrderValidationError("Valid product ID is required");
      }

      if (!product.quantity || product.quantity <= 0) {
        throw new OrderValidationError(
          "Product quantity must be greater than 0",
        );
      }
    }
  }

  /**
   * Validate that all products exist in the database
   */
  private async validateProductsExist(
    productIds: number[],
  ): Promise<Record<number, any>> {
    const products = await db
      .select()
      .from(productsTable)
      .where(
        productIds.length === 1
          ? eq(productsTable.id, productIds[0])
          : inArray(productsTable.id, productIds),
      );

    const productMap: Record<number, any> = {};
    for (const product of products) {
      productMap[product.id] = product;
    }

    for (const productId of productIds) {
      if (!productMap[productId]) {
        throw new InvalidProductError(productId);
      }
    }

    return productMap;
  }

  /**
   * Find orders based on various criteria
   *
   *@param options - Search criteria for finding orders (orderId, userId, status)
   *@param options.orderId - Optional order ID to search for
   *@param options.userId - Optional user ID to filter orders by
   *@param options.status - Optional order status to filter by
   *@returns An object containing the list of matching orders and the first order for reference
   *@throws Error if no orders are found matching the criteria
   */
  private async findOrder({
    options,
  }: {
    options?: findOrderOptions;
  }): Promise<findOrderResponse> {
    const { orderId, userId, status, limit, offset } = options || {};

    let whereconditions = [];

    if (orderId) {
      whereconditions.push(eq(ordersTable.id, orderId));
    }

    if (userId) {
      whereconditions.push(eq(ordersTable.userId, userId));
    }

    if (status) {
      whereconditions.push(eq(ordersTable.status, status));
    }

    const orderRecord = await db
      .select()
      .from(ordersTable)
      .where(and(...whereconditions))
      .limit(limit || 10)
      .offset(offset || 0);

    if (!orderRecord || orderRecord.length === 0) {
      throw new Error("Orders not found");
    }

    let orders: IOrderResult[] = [];
    for (const order of orderRecord) {
      let orderItem: IOrderResult;
      // Fetch order items
      const orderItems = await db
        .select()
        .from(orderProductTable)
        .where(eq(orderProductTable.orderId, order.id));

      // Fetch addresses
      const [shippingAddr] = await db
        .select()
        .from(addressesTable)
        .where(eq(addressesTable.id, order.shippingAddressId))
        .limit(1);

      const [billingAddr] = await db
        .select()
        .from(addressesTable)
        .where(eq(addressesTable.id, order.billingAddressId))
        .limit(1);

      // Calculate pricing information
      const pricing: IOrderPricing = {
        originalAmount: order.totalAmount, // Assuming this is in the correct currency
        convertedAmount: order.totalAmount, // For simplicity, using the same value
        currency: order.totalAmountCurrency as DefinitionCurrency,
        exchangeRate: 1, // Exchange rate would need to be stored in the order for accurate conversion
      };

      orders.push({
        ...(order as TOrder),
        shippingAddress: shippingAddr as IAddressOutput,
        billingAddress: billingAddr as IAddressOutput,
        items: orderItems.map((item) => ({
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          quantity: item.quantity,
          priceAtOrder: item.priceAtOrder / 100, // Convert back to normal units
          createdAt: item.createdAt,
        })),
        pricing,
      });
    }

    return {
      orders,
      firstOrder: orders[0],
    };
  }

  private async updateOrderStatus(
    orderId: number,
    status: OStatusType,
  ): Promise<void> {
    await db
      .update(ordersTable)
      .set({ status })
      .where(eq(ordersTable.id, orderId));
  }

  /**
   * Get product price in a specific currency
   */
  private async getProductPrice(
    productId: number,
    currency: DefinitionCurrency,
  ): Promise<number> {
    const [priceRecord] = await db
      .select()
      .from(productsPriceTables)
      .where(
        and(
          eq(productsPriceTables.productId, productId),
          eq(productsPriceTables.currencyType, currency),
        ),
      )
      .limit(1);

    if (!priceRecord) {
      throw new Error(
        `Price not found for product ${productId} in currency ${currency}`,
      );
    }

    return priceRecord.priceAmount;
  }

  /**
   * Create order with products and addresses
   */
  async createOrder(data: IOrderInput, userId: number): Promise<IOrderResult> {
    // Validate input
    this.validateOrderInput(data);

    return await dbPool.transaction(async (tx) => {
      // Determine order currency based on payment method
      const orderCurrency = currencyService.getCurrencyByPaymentMethod(
        data.paymentMethod as PaymentMethod,
      ) as DefinitionCurrency;

      // Get unique product IDs
      const productIds = [...new Set(data.products.map((p) => p.productId))];

      // Validate all products exist
      const productMap = await this.validateProductsExist(productIds);

      // Calculate total amount in order currency
      let totalAmountInINR = 0;
      let totalAmountInOrderCurrency = 0;
      let exchangeRate = 1;

      for (const item of data.products) {
        const price = await this.getProductPrice(item.productId, orderCurrency);
        totalAmountInOrderCurrency += price * item.quantity;

        // Also calculate in INR for reference
        if (orderCurrency === "usd") {
          const priceInINR = await this.getProductPrice(item.productId, "inr");
          totalAmountInINR += priceInINR * item.quantity;
        } else {
          totalAmountInINR += price * item.quantity;
        }
      }

      // Calculate exchange rate if conversion is needed
      if (orderCurrency === "usd") {
        const conversion = await this.convertPrice(
          totalAmountInINR,
          "inr",
          "usd",
        );
        exchangeRate = conversion.rate;
      }

      // Create or fetch shipping address
      let shippingAddressId: number;
      const [existingShippingAddress] = await tx
        .select()
        .from(addressesTable)
        .where(
          and(
            eq(addressesTable.userId, userId),
            eq(addressesTable.addressType, "shipping"),
            eq(addressesTable.isDefault, true),
          ),
        )
        .limit(1);

      if (existingShippingAddress && !data.shippingAddress) {
        shippingAddressId = existingShippingAddress.id;
      } else {
        const [newAddress] = await tx
          .insert(addressesTable)
          .values({
            userId,
            addressType: "shipping",
            streetAddress1: data.shippingAddress.streetAddress1,
            streetAddress2: data.shippingAddress.streetAddress2,
            city: data.shippingAddress.city,
            state: data.shippingAddress.state,
            postalCode: data.shippingAddress.postalCode,
            country: data.shippingAddress.country,
            isDefault: data.shippingAddress.isDefault ?? false,
          })
          .returning();

        shippingAddressId = newAddress.id;
      }

      // Create or fetch billing address
      let billingAddressId: number;

      if (data.billingAddress) {
        const [newBillingAddress] = await tx
          .insert(addressesTable)
          .values({
            userId,
            addressType: "billing",
            streetAddress1: data.billingAddress.streetAddress1,
            streetAddress2: data.billingAddress.streetAddress2,
            city: data.billingAddress.city,
            state: data.billingAddress.state,
            postalCode: data.billingAddress.postalCode,
            country: data.billingAddress.country,
            isDefault: data.billingAddress.isDefault ?? false,
          })
          .returning();

        billingAddressId = newBillingAddress.id;
      } else {
        // Use shipping address as billing address
        billingAddressId = shippingAddressId;
      }

      // Create order record
      const [order] = await tx
        .insert(ordersTable)
        .values({
          userId,
          totalAmount: Math.round(totalAmountInOrderCurrency * 100), // Store in smallest unit
          totalAmountCurrency: orderCurrency,
          status: "processing",
          paymentMethod: data.paymentMethod,
          shippingAddressId,
          billingAddressId,
          notes: data.notes,
        })
        .returning();

      // Create order product associations
      const orderItems: IOrderItemOutput[] = [];

      for (const item of data.products) {
        const price = await this.getProductPrice(item.productId, orderCurrency);

        const [orderProduct] = await tx
          .insert(orderProductTable)
          .values({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            priceAtOrder: Math.round(price * 100), // Store in smallest unit
          })
          .returning();

        orderItems.push({
          id: orderProduct.id,
          orderId: orderProduct.orderId,
          productId: orderProduct.productId,
          quantity: orderProduct.quantity,
          priceAtOrder: orderProduct.priceAtOrder / 100, // Convert back to normal units
          createdAt: orderProduct.createdAt,
        });
      }

      // Fetch address details
      const [shippingAddr] = await tx
        .select()
        .from(addressesTable)
        .where(eq(addressesTable.id, shippingAddressId))
        .limit(1);

      const [billingAddr] = await tx
        .select()
        .from(addressesTable)
        .where(eq(addressesTable.id, billingAddressId))
        .limit(1);

      // Calculate pricing information
      const pricing: IOrderPricing = {
        originalAmount: totalAmountInINR,
        convertedAmount: totalAmountInOrderCurrency,
        currency: orderCurrency,
        exchangeRate,
      };

      // Return complete order result
      return {
        ...(order as TOrder),
        shippingAddress: shippingAddr as IAddressOutput,
        billingAddress: billingAddr as IAddressOutput,
        items: orderItems,
        pricing,
      };
    });
  }

  async getOrdersByUserId(
    orderId: number,
    userId: number,
  ): Promise<IOrderResult[]> {
    try {
      const result = await this.findOrder({
        options: { userId, orderId },
      });

      return result.orders;
    } catch (error: unknown) {
      throw new Error("Failed to fetch orders for user", {
        cause: error,
      });
    }
  }

  async getOrderById(orderId: number): Promise<IOrderResult> {
    try {
      const { firstOrder: order } = await this.findOrder({
        options: { orderId },
      });

      return order;
    } catch (error) {
      throw new Error("Failed to fetch order", {
        cause: error,
      });
    }
  }

  async getAllOrders(
    options?: getAllOrdersOptions,
  ): Promise<{ orders: IOrderResult[]; total: number }> {
    try {
      const { orders } = await this.findOrder({
        options,
      });

      return { orders, total: orders.length };
    } catch (error) {
      throw new Error("Failed to fetch orders", {
        cause: error,
      });
    }
  }
}

export const orderService = new OrderService();
