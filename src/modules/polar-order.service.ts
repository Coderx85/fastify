import { Polar } from "@polar-sh/sdk";
import { config } from "@/lib/config";

/**
 * Polar Order Service
 *
 * Handles one-time SaaS payments through Polar.
 * For your use case: one SaaS license per user.
 */

const polar = new Polar({
  accessToken: config.POLAR_ACCESS_TOKEN,
  server: config.POLAR_SERVER,
});

// In-memory store for demo. Replace with your database.
interface PolarOrder {
  polarOrderId: string;
  polarCustomerId: string;
  polarProductId: string;
  amountCents: number;
  currency: string;
  status: "created" | "paid" | "refunded";
  customerEmail?: string;
  customerExternalId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory store - replace with database in production
const ordersStore: Map<string, PolarOrder> = new Map();
const userAccessStore: Map<string, { productId: string; grantedAt: Date }> =
  new Map();

export interface SaveOrderParams {
  polarOrderId: string;
  polarCustomerId: string;
  polarProductId: string;
  amountCents: number;
  currency: string;
  status: "created" | "paid" | "refunded";
  customerEmail?: string;
  customerExternalId?: string;
}

class PolarOrderService {
  /**
   * Save an order from webhook
   */
  async saveOrder(params: SaveOrderParams): Promise<PolarOrder> {
    const now = new Date();
    const order: PolarOrder = {
      ...params,
      createdAt: now,
      updatedAt: now,
    };

    ordersStore.set(params.polarOrderId, order);
    console.log(`📝 Order saved: ${params.polarOrderId}`);

    // TODO: Replace with actual database insert
    // await db.insert(polarOrders).values(order);

    return order;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    polarOrderId: string,
    status: "created" | "paid" | "refunded",
  ): Promise<void> {
    const order = ordersStore.get(polarOrderId);
    if (order) {
      order.status = status;
      order.updatedAt = new Date();
      ordersStore.set(polarOrderId, order);
      console.log(`📝 Order ${polarOrderId} status updated to: ${status}`);
    }

    // TODO: Replace with actual database update
    // await db.update(polarOrders)
    //   .set({ status, updatedAt: new Date() })
    //   .where(eq(polarOrders.polarOrderId, polarOrderId));
  }

  /**
   * Grant access to a user
   * Called when order.paid webhook is received
   */
  async grantAccess(userExternalId: string, productId: string): Promise<void> {
    userAccessStore.set(userExternalId, {
      productId,
      grantedAt: new Date(),
    });
    console.log(`🎉 Access granted to user: ${userExternalId}`);

    // TODO: Replace with your access granting logic
    // await db.update(users)
    //   .set({ hasAccess: true, productId })
    //   .where(eq(users.externalId, userExternalId));
  }

  /**
   * Revoke access from a user
   * Called when order.refunded webhook is received
   */
  async revokeAccess(userExternalId: string): Promise<void> {
    userAccessStore.delete(userExternalId);
    console.log(`❌ Access revoked for user: ${userExternalId}`);

    // TODO: Replace with your access revocation logic
    // await db.update(users)
    //   .set({ hasAccess: false })
    //   .where(eq(users.externalId, userExternalId));
  }

  /**
   * Check if a user has paid for the product
   */
  async hasUserPaid(userExternalId: string): Promise<boolean> {
    return userAccessStore.has(userExternalId);

    // TODO: Replace with database query
    // const user = await db.query.users.findFirst({
    //   where: eq(users.externalId, userExternalId),
    // });
    // return user?.hasAccess ?? false;
  }

  /**
   * Get user access details
   */
  async getUserAccess(
    userExternalId: string,
  ): Promise<{ hasAccess: boolean; productId?: string; grantedAt?: Date }> {
    const access = userAccessStore.get(userExternalId);
    if (access) {
      return { hasAccess: true, ...access };
    }
    return { hasAccess: false };
  }

  /**
   * Get order by ID from Polar API
   */
  async getOrderFromPolar(orderId: string) {
    try {
      const order = await polar.orders.get({ id: orderId });
      return order;
    } catch (error) {
      console.error("Failed to get order from Polar:", error);
      throw error;
    }
  }

  /**
   * List orders for a customer from Polar API
   */
  async getCustomerOrdersFromPolar(customerId: string) {
    try {
      const ordersResponse = await polar.orders.list({
        customerId,
        productBillingType: "one_time",
      });

      const orders = [];
      for await (const page of ordersResponse) {
        orders.push(...page.result.items);
      }
      return orders;
    } catch (error) {
      console.error("Failed to list customer orders from Polar:", error);
      throw error;
    }
  }

  /**
   * Verify if an external user has paid by checking Polar directly
   * Use this as a fallback verification method
   */
  async verifyUserPaymentFromPolar(externalId: string): Promise<{
    hasPaid: boolean;
    order?: unknown;
  }> {
    try {
      // Get customer by external ID
      const customer = await polar.customers.getExternal({ externalId });

      if (!customer) {
        return { hasPaid: false };
      }

      // Get their orders
      const ordersResponse = await polar.orders.list({
        customerId: customer.id,
        productId: config.POLAR_PRODUCT_ID,
        productBillingType: "one_time",
      });

      const orders = [];
      for await (const page of ordersResponse) {
        orders.push(...page.result.items);
      }

      // Check if any order is paid
      const paidOrder = orders.find(
        (order) => order.billingReason === "purchase",
      );

      return {
        hasPaid: !!paidOrder,
        order: paidOrder,
      };
    } catch (error) {
      console.error("Failed to verify payment from Polar:", error);
      return { hasPaid: false };
    }
  }

  /**
   * Get the product details
   */
  async getProduct() {
    try {
      const product = await polar.products.get({ id: config.POLAR_PRODUCT_ID });
      return product;
    } catch (error) {
      console.error("Failed to get product:", error);
      throw error;
    }
  }

  /**
   * List all products (if you have multiple)
   */
  async listProducts() {
    try {
      const productsResponse = await polar.products.list({
        isRecurring: false, // Only one-time products
      });

      const products = [];
      for await (const page of productsResponse) {
        products.push(...page.result.items);
      }
      return products;
    } catch (error) {
      console.error("Failed to list products:", error);
      throw error;
    }
  }
}

export const orderService = new PolarOrderService();
