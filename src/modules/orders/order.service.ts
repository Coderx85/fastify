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
} from "./order.definiton";
import {
  currencyService,
  type PaymentMethod,
  type CurrencyType,
} from "@/modules/currency/currency.service";
import { eq, and, inArray } from "drizzle-orm";

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

  async getOrderById(
    orderId: number,
    userId: number,
  ): Promise<IOrderResult | null> {
    try {
      const [orderRecord] = await db
        .select()
        .from(ordersTable)
        .where(and(eq(ordersTable.id, orderId), eq(ordersTable.userId, userId)))
        .limit(1);

      if (!orderRecord) {
        return null;
      }

      // Fetch order items
      const orderItems = await db
        .select()
        .from(orderProductTable)
        .where(eq(orderProductTable.orderId, orderId));

      // Fetch addresses
      const [shippingAddr] = await db
        .select()
        .from(addressesTable)
        .where(eq(addressesTable.id, orderRecord.shippingAddressId))
        .limit(1);

      const [billingAddr] = await db
        .select()
        .from(addressesTable)
        .where(eq(addressesTable.id, orderRecord.billingAddressId))
        .limit(1);

      // Calculate pricing information
      const pricing: IOrderPricing = {
        originalAmount: orderRecord.totalAmount, // Assuming this is in the correct currency
        convertedAmount: orderRecord.totalAmount, // For simplicity, using the same value
        currency: orderRecord.totalAmountCurrency as DefinitionCurrency,
        exchangeRate: 1, // Exchange rate would need to be stored in the order for accurate conversion
      };

      return {
        ...(orderRecord as TOrder),
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
      };
    } catch (error) {
      throw new Error("Failed to fetch order", {
        cause: error,
      });
    }
  }
}

export const orderService = new OrderService();
