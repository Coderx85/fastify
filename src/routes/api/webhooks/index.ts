import type { FastifyInstance } from "fastify";
import { Webhooks } from "@polar-sh/fastify";
import { config } from "@/lib/config";
import { paymentService } from "@/modules/payment/payment.service";
// NOTE: polar-order.service is used for the simple SaaS example and is
// intentionally _not_ imported here.  Our e-commerce flow now creates orders
// in the main orders module via the paymentService.

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

        // store order metadata in provider so that later a `order.paid`
        // event will trigger actual creation via paymentService.  nothing to
        // do here for e-commerce orders since they will be created after
        // payment is captured.
        console.log("polar order created event received (noop)");
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

        // order has been paid; create it in our system if metadata exists
        // Removed Polar webhook handling
        // try {
        //   await paymentService.handlePolarWebhook(payload);
        // } catch (error) {
        //   console.error(
        //     "Failed to process paid order via paymentService:",
        //     error,
        //   );
        // }
      },

      /**
       * Triggered when an order is refunded
       * Revoke access here
       */
      onOrderRefunded: async (payload) => {
        const { id } = payload.data;
        const customerExternalId = payload.data.customer?.externalId;

        console.log("💰 Order Refunded (e-commerce):", {
          orderId: id,
          customerExternalId,
        });
        // refunds are not yet handled by the paymentService; you could extend
        // it here if you want to automatically cancel / mark orders as
        // refunded when Polar notifies us.
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
