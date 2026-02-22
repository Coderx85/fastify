import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { orderService } from "@/modules/polar-order.service";
import { sendError, sendSuccess } from "@/lib/response";

// pull in shared schemas and handlers from the main order module so we can
// expose the same create/lookup functionality under the `/api/orders` prefix.
import { createOrderSchema } from "@/schema/order.schema";
import { createOrderHandler } from "../order/handler";

const ExternalIdParamSchema = z.object({
  externalId: z.string(),
});

/**
 * Order Verification Routes
 *
 * Endpoints to check if a user has purchased your SaaS product.
 * Use these in your app to verify access.
 */
export default async function ordersRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  /**
   * GET /api/orders/access/:externalId
   *
   * Check if a user has access (has paid for the product)
   * Use your internal user ID as the externalId
   *
   * Example: GET /api/orders/access/user_12345
   */
  app.get(
    "/access/:externalId",
    {
      schema: {
        params: ExternalIdParamSchema,
        description: "Check if a user has access to the SaaS product",
        tags: ["Orders", "Access"],
      },
    },
    async (
      req: FastifyRequest<{ Params: z.infer<typeof ExternalIdParamSchema> }>,
      reply: FastifyReply,
    ) => {
      try {
        const { externalId } = req.params;
        const access = await orderService.getUserAccess(externalId);

        return sendSuccess(
          {
            hasAccess: access.hasAccess,
            productId: access.productId,
            grantedAt: access.grantedAt,
          },
          access.hasAccess ? "User has access" : "User does not have access",
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
   * GET /api/orders/verify/:externalId
   *
   * Verify payment directly from Polar API
   * Use this as a fallback or for double-checking
   */
  app.get(
    "/verify/:externalId",
    {
      schema: {
        params: ExternalIdParamSchema,
        description: "Verify payment directly from Polar API",
        tags: ["Orders", "Verification"],
      },
    },
    async (
      req: FastifyRequest<{ Params: z.infer<typeof ExternalIdParamSchema> }>,
      reply: FastifyReply,
    ) => {
      try {
        const { externalId } = req.params;
        const verification =
          await orderService.verifyUserPaymentFromPolar(externalId);

        return sendSuccess(
          {
            hasPaid: verification.hasPaid,
            order: verification.order,
          },
          verification.hasPaid ? "Payment verified" : "No payment found",
          reply,
          200,
        );
      } catch (error) {
        req.log.error(error);
        return sendError(
          "Failed to verify payment",
          "VERIFICATION_FAILED",
          reply,
          500,
        );
      }
    },
  );

  /**
   * POST /api/orders
   *
   * Mirror the main order-creation endpoint so that callers targeting the
   * plural `/orders` prefix (used by the frontend and documentation) will
   * succeed.  We simply delegate to the existing handler and schema from the
   * singular `order` routes.
   */
  app.post("/", {
    schema: createOrderSchema,
    handler: createOrderHandler.handler,
  });

  /**
   * GET /api/orders/product
   *
   * Get the current product details from Polar
   */
  app.get("/product", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const product = await orderService.getProduct();
      return sendSuccess({ product }, "Product retrieved", reply, 200);
    } catch (error) {
      req.log.error(error);
      return sendError(
        "Failed to fetch product",
        "PRODUCT_FETCH_FAILED",
        reply,
        500,
      );
    }
  });

  /**
   * GET /api/orders/products
   *
   * List all one-time purchase products
   */
  app.get("/products", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const products = await orderService.listProducts();
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
}
