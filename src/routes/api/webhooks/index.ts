import { FastifyInstance } from "fastify";
import { Webhooks } from "@polar-sh/fastify";
import { config } from "@/lib/config";
import { orderService } from "@/modules/polar-order.service";

/**
 * Polar Webhooks Handler
 *
 * Receives webhook events from Polar after:
 *   - Checkout completion
 *   - Order creation/payment
 *   - Subscription changes (if applicable)
 *
 * Setup in Polar Dashboard:
 *   1. Go to Settings > Webhooks
 *   2. Add endpoint: https://your-domain.com/api/webhooks/polar
 *   3. Select events: order.created, order.paid
 *   4. Copy the webhook secret to POLAR_WEBHOOK_SECRET
 *
 * For sandbox: https://sandbox.polar.sh/dashboard/settings/webhooks
 */
export default async function webhooksRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/polar",
    Webhooks({
      webhookSecret: config.POLAR_WEBHOOK_SECRET,

      /**
       * Triggered when an order is created (after checkout)
       * For one-time payments, this happens immediately after payment
       */
      onOrderCreated: async (payload) => {
        const order = payload.data;
        const { id, customerId, productId, createdAt } = order;

        // Get amount from netAmount (in cents)
        const amountCents = order.netAmount;
        const currency = order.currency;

        console.log("📦 Order Created:", {
          orderId: id,
          customerId,
          productId,
          amount: amountCents / 100, // Convert cents to dollars
          currency,
          createdAt,
        });

        // Store order in your database
        try {
          await orderService.saveOrder({
            polarOrderId: id,
            polarCustomerId: customerId,
            polarProductId: productId ?? "",
            amountCents,
            currency,
            status: "created",
            customerEmail: order.customer?.email,
            customerExternalId: order.customer?.externalId ?? undefined,
          });
        } catch (error) {
          console.error("Failed to save order:", error);
        }
      },

      /**
       * Triggered when an order is paid (payment confirmed)
       * This is where you should grant access to your SaaS
       */
      onOrderPaid: async (payload) => {
        const order = payload.data;
        const { id, customerId, productId } = order;
        const customerExternalId = order.customer?.externalId;
        const amountCents = order.netAmount;

        console.log("✅ Order Paid:", {
          orderId: id,
          customerId,
          productId,
          amount: amountCents / 100,
          customerExternalId,
        });

        // Update order status and grant access
        try {
          await orderService.updateOrderStatus(id, "paid");

          // Grant access to your SaaS
          if (customerExternalId && productId) {
            await orderService.grantAccess(customerExternalId, productId);
            console.log(`🎉 Access granted to user: ${customerExternalId}`);
          }
        } catch (error) {
          console.error("Failed to process paid order:", error);
        }
      },

      /**
       * Triggered when an order is refunded
       * Revoke access here
       */
      onOrderRefunded: async (payload) => {
        const { id } = payload.data;
        const customerExternalId = payload.data.customer?.externalId;

        console.log("💰 Order Refunded:", { orderId: id, customerExternalId });

        try {
          await orderService.updateOrderStatus(id, "refunded");

          if (customerExternalId) {
            await orderService.revokeAccess(customerExternalId);
            console.log(`❌ Access revoked for user: ${customerExternalId}`);
          }
        } catch (error) {
          console.error("Failed to process refund:", error);
        }
      },

      /**
       * Catch-all handler for debugging
       * Remove or disable in production
       */
      onPayload: async (payload) => {
        console.log("🔔 Webhook received:", payload.type);
      },
    }),
  );
}
