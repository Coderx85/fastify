import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { polarService } from "@/modules/payment/polar.service";
import { sendError, sendSuccess } from "@/lib/response";

// Zod schemas for request validation
const CreateCheckoutSchema = z.object({
  customerEmail: z.string().email().optional(),
  customerName: z.string().optional(),
  externalCustomerId: z.string().optional(),
  successUrl: z.string().url().optional(),
  returnUrl: z.string().url().optional(),
});

const ExternalIdParamSchema = z.object({
  externalId: z.string(),
});

export default async function polarRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post(
    "/checkout",
    {
      schema: {
        body: CreateCheckoutSchema,
        description: "Create a new checkout session",
        tags: ["Polar", "Checkout"],
      },
    },
    async (
      req: FastifyRequest<{ Body: z.infer<typeof CreateCheckoutSchema> }>,
      reply: FastifyReply,
    ) => {
      try {
        const checkout = await polarService.createCheckout(req.body);

        return sendSuccess(
          { checkout },
          "Checkout created successfully",
          reply,
          201,
        );
      } catch (error) {
        req.log.error(error);
        return sendError(
          "Failed to create checkout",
          "CHECKOUT_CREATION_FAILED",
          reply,
          500,
        );
      }
    },
  );

  /**
   * GET /api/payment/polar/access/:externalId
   * Check if a user has access (active subscription)
   */
  app.get(
    "/access/:externalId",
    {
      schema: {
        params: ExternalIdParamSchema,
      },
    },
    async (
      req: FastifyRequest<{ Params: z.infer<typeof ExternalIdParamSchema> }>,
      reply: FastifyReply,
    ) => {
      try {
        const access = await polarService.checkUserAccess(
          req.params.externalId,
        );
        return sendSuccess(
          {
            hasAccess: access.hasAccess,
            subscription: access.subscription,
          },
          access.hasAccess ? "Access granted" : "No active subscription",
          reply,
          200,
        );
      } catch (error) {
        req.log.error(error);
        return sendError(
          "Failed to check access",
          "ACCESS_CHECK_FAILED",
          reply,
          500,
        );
      }
    },
  );

  /**
   * GET /api/payment/polar/plan/:externalId
   * Get the plan tier for a user
   */
  app.get(
    "/plan/:externalId",
    {
      schema: {
        params: ExternalIdParamSchema,
      },
    },
    async (
      req: FastifyRequest<{ Params: z.infer<typeof ExternalIdParamSchema> }>,
      reply: FastifyReply,
    ) => {
      try {
        const tier = await polarService.getUserPlanTier(req.params.externalId);
        return sendSuccess({ tier }, `User is on ${tier} plan`, reply, 200);
      } catch (error) {
        req.log.error(error);
        return sendError(
          "Failed to get plan tier",
          "PLAN_TIER_FAILED",
          reply,
          500,
        );
      }
    },
  );

  /**
   * GET /api/payment/polar/products
   * List all products from Polar
   */
  app.get("/products", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const products = await polarService.listProducts();
      return sendSuccess({ products }, "Products retrieved", reply, 200);
    } catch (error) {
      req.log.error(error);
      return sendError(
        "Failed to fetch products",
        "PRODUCTS_FETCH_FAILED",
        reply,
        500,
      );
    }
  });

  /**
   * GET /api/payment/polar/status
   * Check Polar integration status and environment
   */
  app.get("/status", async (req: FastifyRequest, reply: FastifyReply) => {
    const { config } = await import("@/lib/config");

    const isSandbox = config.POLAR_SERVER === "sandbox";
    const hasToken = !!config.POLAR_ACCESS_TOKEN;
    const hasOrgId = !!config.POLAR_ORGANIZATION_ID;
    const hasProductId = !!config.POLAR_PRODUCT_ID;

    let apiStatus: "connected" | "error" | "not_configured";
    let apiError: string | null = null;

    if (hasToken) {
      try {
        await polarService.listProducts();
        apiStatus = "connected";
      } catch (error) {
        apiStatus = "error";
        apiError = error instanceof Error ? error.message : "Unknown error";
      }
    } else {
      apiStatus = "not_configured";
    }

    return sendSuccess(
      {
        environment: isSandbox ? "sandbox" : "production",
        apiBaseUrl: isSandbox
          ? "https://sandbox-api.polar.sh"
          : "https://api.polar.sh",
        dashboardUrl: isSandbox
          ? "https://sandbox.polar.sh"
          : "https://polar.sh",
        configuration: {
          hasAccessToken: hasToken,
          hasOrganizationId: hasOrgId,
          hasProductId: hasProductId,
          organizationId: hasOrgId ? config.POLAR_ORGANIZATION_ID : null,
          productId: hasProductId ? config.POLAR_PRODUCT_ID : null,
        },
        api: {
          status: apiStatus,
          error: apiError,
        },
        testCard: isSandbox
          ? {
              number: "4242 4242 4242 4242",
              expiry: "Any future date",
              cvc: "Any 3 digits",
              description: "Use this card for test payments in sandbox",
            }
          : null,
      },
      "Polar integration status",
      reply,
      200,
    );
  });
}
