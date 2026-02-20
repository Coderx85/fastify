import { Polar } from "@polar-sh/sdk";
import { config } from "@/lib/config";

let polar: Polar | null = null;

function getPolarInstance(): Polar | null {
  if (!config.POLAR_ACCESS_TOKEN) {
    return null;
  }
  if (!polar) {
    polar = new Polar({
      accessToken: config.POLAR_ACCESS_TOKEN,
      server: config.POLAR_SERVER,
    });
  }
  return polar;
}

export interface CreateCheckoutParams {
  customerEmail?: string;
  customerName?: string;
  externalCustomerId?: string; // Your internal user ID
  successUrl?: string;
  returnUrl?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface CustomerParams {
  email: string;
  name?: string;
  externalId?: string; // Link to your internal user ID
  metadata?: Record<string, string | number | boolean>;
  organizationId: string;
}

class PolarBackendService {
  private getPolarInstance(): Polar {
    const instance = getPolarInstance();
    if (!instance) {
      throw new Error('Polar SDK is not configured. Please set POLAR_ACCESS_TOKEN environment variable.');
    }
    return instance;
  }

  async createCheckout(params: CreateCheckoutParams) {
    try {
      const polar = this.getPolarInstance();
      const checkout = await polar.checkouts.create({
        products: [config.POLAR_PRODUCT_ID],
        customerEmail: params.customerEmail,
        customerName: params.customerName,
        externalCustomerId: params.externalCustomerId,
        successUrl: params.successUrl || config.SUCCESS_URL,
        returnUrl: params.returnUrl || config.RETURN_URL,
      });

      return {
        checkoutId: checkout.id,
        checkoutUrl: checkout.url,
        expiresAt: checkout.expiresAt,
        status: checkout.status,
      };
    } catch (error) {
      console.error("Failed to create checkout:", error);
      throw new Error("Checkout creation failed");
    }
  }

  async getCheckout(checkoutId: string) {
    try {
      const polar = this.getPolarInstance();
      const checkout = await polar.checkouts.get({ id: checkoutId });
      return checkout;
    } catch (error) {
      console.error("Failed to get checkout:", error);
      throw error;
    }
  }

  async createCustomer(params: CustomerParams) {
    try {
      const polar = this.getPolarInstance();
      const customer = await polar.customers.create({
        email: params.email,
        name: params.name,
        externalId: params.externalId,
        metadata: params.metadata,
        organizationId: params.organizationId || config.POLAR_ORGANIZATION_ID,
      });

      return {
        customerId: customer.id,
        email: customer.email,
        name: customer.name,
        externalId: customer.externalId,
      };
    } catch (error) {
      console.error("Failed to create customer:", error);
      throw error;
    }
  }

  async getCustomer(customerId: string) {
    try {
      const polar = this.getPolarInstance();
      const customer = await polar.customers.get({ id: customerId });
      return customer;
    } catch (error) {
      console.error("Failed to get customer:", error);
      throw error;
    }
  }

  async getCustomerByExternalId(externalId: string) {
    try {
      const polar = this.getPolarInstance();
      const customer = await polar.customers.getExternal({
        externalId: externalId,
      });
      return customer;
    } catch (error) {
      // Customer not found is a normal case, not an error
      console.error("Failed to get customer by external ID:", error);
      return null;
    }
  }

  async listCustomers(limit = 20) {
    try {
      const polar = this.getPolarInstance();
      const customersResponse = await polar.customers.list({
        organizationId: config.POLAR_ORGANIZATION_ID,
        limit,
      });

      // Collect all customers from paginated response
      const customers = [];
      for await (const page of customersResponse) {
        customers.push(...page.result.items);
        if (customers.length >= limit) break;
      }
      return customers.slice(0, limit);
    } catch (error) {
      console.error("Failed to list customers:", error);
      throw error;
    }
  }

  async getCustomerSubscriptions(customerId: string) {
    try {
      const polar = this.getPolarInstance();
      const subscriptionsResponse = await polar.subscriptions.list({
        customerId,
        organizationId: config.POLAR_ORGANIZATION_ID,
      });

      const subscriptions = [];
      for await (const page of subscriptionsResponse) {
        subscriptions.push(...page.result.items);
      }
      return subscriptions;
    } catch (error) {
      console.error("Failed to get customer subscriptions:", error);
      throw error;
    }
  }

  async getSubscription(subscriptionId: string) {
    try {
      const polar = this.getPolarInstance();
      const subscription = await polar.subscriptions.get({
        id: subscriptionId,
      });
      return subscription;
    } catch (error) {
      console.error("Failed to get subscription:", error);
      throw error;
    }
  }

  async hasActiveSubscription(customerId: string): Promise<boolean> {
    try {
      const subscriptions = await this.getCustomerSubscriptions(customerId);
      const productId = config.POLAR_PRODUCT_ID;

      const activeSubscription = subscriptions.find((sub) => {
        const isActive = sub.status === "active";
        if (productId) {
          return isActive && sub.productId === productId;
        }
        return isActive;
      });

      return !!activeSubscription;
    } catch (error) {
      console.error("Failed to check subscription status:", error);
      return false;
    }
  }

  async revokeSubscription(subscriptionId: string) {
    try {
      const polar = this.getPolarInstance();
      const subscription = await polar.subscriptions.revoke({
        id: subscriptionId,
      });
      return subscription;
    } catch (error) {
      console.error("Failed to revoke subscription:", error);
      throw error;
    }
  }

  async cancelSubscriptionAtPeriodEnd(subscriptionId: string) {
    try {
      const subscription = await polar.subscriptions.update({
        id: subscriptionId,
        subscriptionUpdate: {
          cancelAtPeriodEnd: true,
        },
      });
      return subscription;
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      throw error;
    }
  }

  async listProducts() {
    try {
      const productsResponse = await polar.products.list({
        organizationId: config.POLAR_ORGANIZATION_ID,
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

  async getProduct(productId: string) {
    try {
      const polar = this.getPolarInstance();
      const product = await polar.products.get({ id: productId });
      return product;
    } catch (error) {
      console.error("Failed to get product:", error);
      throw error;
    }
  }

  async getCustomerOrders(customerId: string) {
    try {
      const ordersResponse = await polar.orders.list({
        customerId,
        organizationId: config.POLAR_ORGANIZATION_ID,
      });

      const orders = [];
      for await (const page of ordersResponse) {
        orders.push(...page.result.items);
      }
      return orders;
    } catch (error) {
      console.error("Failed to get customer orders:", error);
      throw error;
    }
  }

  async getOrder(orderId: string) {
    try {
      const polar = this.getPolarInstance();
      const order = await polar.orders.get({ id: orderId });
      return order;
    } catch (error) {
      console.error("Failed to get order:", error);
      throw error;
    }
  }

  async listBenefits() {
    try {
      const benefitsResponse = await polar.benefits.list({
        organizationId: config.POLAR_ORGANIZATION_ID,
      });

      const benefits = [];
      for await (const page of benefitsResponse) {
        benefits.push(...page.result.items);
      }
      return benefits;
    } catch (error) {
      console.error("Failed to list benefits:", error);
      throw error;
    }
  }

  async checkUserAccess(userExternalId: string): Promise<{
    hasAccess: boolean;
    subscription: unknown | null;
    customer: unknown | null;
  }> {
    try {
      // Find customer by your internal user ID
      const customer = await this.getCustomerByExternalId(userExternalId);

      if (!customer) {
        return { hasAccess: false, subscription: null, customer: null };
      }

      // Check for active subscription
      const subscriptions = await this.getCustomerSubscriptions(customer.id);
      const activeSubscription = subscriptions.find(
        (sub) => sub.status === "active",
      );

      return {
        hasAccess: !!activeSubscription,
        subscription: activeSubscription || null,
        customer,
      };
    } catch (error) {
      console.error("Failed to check user access:", error);
      return { hasAccess: false, subscription: null, customer: null };
    }
  }

  async getCustomerState(customerId: string) {
    try {
      const polar = this.getPolarInstance();
      const state = await polar.customers.getState({ id: customerId });
      return state;
    } catch (error) {
      console.error("Failed to get customer state:", error);
      throw error;
    }
  }

  async getCustomerStateByExternalId(externalId: string) {
    try {      const polar = this.getPolarInstance();      const state = await polar.customers.getStateExternal({ externalId });
      return state;
    } catch (error) {
      console.error("Failed to get customer state by external ID:", error);
      return null;
    }
  }

  async getUserPlanTier(
    userExternalId: string,
  ): Promise<"free" | "basic" | "pro" | "enterprise"> {
    try {
      const { subscription } = await this.checkUserAccess(userExternalId);

      if (!subscription) {
        return "free";
      }

      const productId = (subscription as { productId: string }).productId;
      const product = await this.getProduct(productId);

      const productName = product.name.toLowerCase();
      if (productName.includes("enterprise")) return "enterprise";
      if (productName.includes("pro")) return "pro";
      if (productName.includes("basic") || productName.includes("starter"))
        return "basic";

      return "basic";
    } catch (error) {
      console.error("Failed to get user plan tier:", error);
      return "free";
    }
  }
}

export const polarService = new PolarBackendService();
