import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Polar } from "@polar-sh/sdk";
import { config } from "@/lib/config";
import { z } from "zod";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { sendError, sendSuccess } from "@/lib";
import { db } from "@/db";

// Initialize Polar SDK only when credentials are available
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

// Schema for checkout query parameters
const CheckoutQuerySchema = z.object({
  // Customer identification (use your internal user ID)
  userId: z.string(),
  // Customer email (pre-fills checkout form)
  email: z.string().email(),
  // Customer name (pre-fills checkout form)
  name: z.string(),
});

type CheckoutQuery = z.infer<typeof CheckoutQuerySchema>;

/**
 * SaaS Checkout Routes
 *
 * Simplified checkout for your single SaaS product.
 * Product ID is configured via POLAR_PRODUCT_ID in .env
 *
 * Usage:
 *   GET /api/checkout?userId=`user_123`&email=`user@example.com`&name=`John`
 *
 * Flow:
 *   1. User clicks "Buy" on your frontend
 *   2. Frontend redirects to: /api/checkout?userId={your_user_id}
 *   3. User completes payment on Polar
 *   4. User is redirected to SUCCESS_URL
 *   5. Webhook grants access via userId
 */
export default async function checkoutRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  /**
   * GET /api/checkout
   *
   * Main checkout endpoint for your SaaS product.
   * Redirects user to Polar checkout page.
   *
   * @query userId - Your internal user ID (important for linking after payment)
   * @query email - Pre-fill customer email
   * @query name - Pre-fill customer name
   */
  app.get(
    "/",
    {
      schema: {
        querystring: CheckoutQuerySchema,
        description: "Create checkout session for SaaS product",
        tags: ["Checkout"],
      },
    },
    async (
      request: FastifyRequest<{ Querystring: CheckoutQuery }>,
      reply: FastifyReply,
    ) => {
      try {
        const { userId, email, name } = request.query;

        if (!userId || !email || !name) {
          return sendError(
            "Missing required parameters (userId, email, and name required)",
            "MISSING_PARAMETERS",
            reply,
            400,
          );
        }

        // Create checkout session using SDK
        // Note: User validation is optional - Polar handles customer management
        // The externalCustomerId links back to your system after payment
        const polarInstance = getPolarInstance();
        if (!polarInstance) {
          sendError(
            "Polar SDK not configured",
            "PAYMENT_NOT_CONFIGURED",
            reply,
            503,
          );
          return;
        }
        const checkout = await polarInstance.checkouts.create({
          // Your SaaS product from config
          products: [config.POLAR_PRODUCT_ID],

          // Link to your internal user (critical for access granting)
          externalCustomerId: userId,
          metadata: {
            userId,
            email,
            name: name || "",
            application: "Fastifyx85",
            createdAt: new Date().toISOString(),
          },

          // Pre-fill customer info
          customerEmail: email,
          customerName: name,

          // Redirect URLs
          successUrl: config.SUCCESS_URL,
        });

        if (!checkout)
          return sendError(
            "Failed to create checkout",
            "CHECKOUT_CREATION_FAILED",
            reply,
            500,
          );

        // Redirect user to Polar checkout page
        return reply.redirect(checkout.url);
      } catch (error) {
        request.log.error(error);
        return sendError(
          "INTERNAL SERVER_ERROR",
          "Failed to create checkout",
          reply,
          500,
        );
      }
    },
  );

  /**
   * POST /api/checkout
   *
   * Create checkout via POST (for API/frontend integration)
   * Returns checkout URL instead of redirecting.
   */
  app.post(
    "/",
    {
      schema: {
        body: CheckoutQuerySchema,
        description: "Create checkout session and return URL",
        tags: ["Checkout"],
      },
    },
    async (
      request: FastifyRequest<{ Body: CheckoutQuery }>,
      reply: FastifyReply,
    ) => {
      try {
        const { userId, email, name } = request.body;

        const polarInstance = getPolarInstance();
        if (!polarInstance) {
          return reply.status(503).send({
            success: false,
            error: "Payment service not configured",
            message: "Polar SDK is not configured",
          });
        }

        const checkout = await polarInstance.checkouts.create({
          products: [config.POLAR_PRODUCT_ID],
          externalCustomerId: userId,
          customerEmail: email,
          customerName: name,
          successUrl: config.SUCCESS_URL,
        });

        return reply.send({
          success: true,
          checkoutUrl: checkout.url,
          checkoutId: checkout.id,
          expiresAt: checkout.expiresAt,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: "Failed to create checkout",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  /**
   * GET /api/checkout/product
   *
   * Get your SaaS product details (price, name, description)
   */
  app.get("/product", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const polarInstance = getPolarInstance();
      if (!polarInstance) {
        return reply.status(503).send({
          success: false,
          error: "Payment service not configured",
          message: "Polar SDK is not configured",
        });
      }
      const product = await polarInstance.products.get({
        id: config.POLAR_PRODUCT_ID,
      });

      // Extract price info
      const price = product.prices?.[0];
      let priceAmount = 0;
      let priceCurrency = "usd";

      if (price && "priceAmount" in price) {
        priceAmount = price.priceAmount;
        priceCurrency = price.priceCurrency;
      }

      // return reply.send({
      // success: true,
      // product: {
      // id: product.id,
      // name: product.name,
      // description: product.description,
      // price: priceAmount / 100, // Convert cents to dollars
      // priceCents: priceAmount,
      // currency: priceCurrency,
      // isArchived: product.isArchived,
      // },
      // });

      const data = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: priceAmount / 100, // Convert cents to dollars
        priceCents: priceAmount,
        currency: priceCurrency,
        isArchived: product.isArchived,
      };

      return sendSuccess(data, "Product retrieved", reply, 200);
    } catch (error) {
      request.log.error(error);
      return sendError(
        "INTERNAL SERVERERROR",
        "Failed to fetch product",
        reply,
        500,
      );
    }
  });
}
