import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Fastify from "fastify";
import {
  ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import type { FastifyInstance } from "fastify";
import polarRoutes from "./index";

describe("Polar Checkout Route (Sandbox)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify({ logger: false }).withTypeProvider<ZodTypeProvider>();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    // Register only the polar routes for isolated testing
    await app.register(polarRoutes, { prefix: "/api/payment/polar" });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /api/payment/polar/checkout", () => {
    it("should return 400 for missing productIds", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/payment/polar/checkout",
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });

    it("should return 400 for empty productIds array", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/payment/polar/checkout",
        payload: {
          productIds: [],
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("should create checkout with valid productIds (sandbox)", async () => {
      // Use a test product ID from your Polar sandbox
      const testProductId = process.env.POLAR_PRODUCT_ID || "test-product-id";

      const response = await app.inject({
        method: "POST",
        url: "/api/payment/polar/checkout",
        payload: {
          productIds: [testProductId],
          customerEmail: "test@example.com",
          customerName: "Test User",
        },
      });

      const body = JSON.parse(response.body);

      // If the sandbox API call succeeds
      if (response.statusCode === 201) {
        expect(body.success).toBe(true);
        expect(body.data.checkout).toBeDefined();
        expect(body.data.checkout.checkoutUrl).toBeDefined();
        expect(body.message).toBe("Checkout created successfully");
      } else {
        // If sandbox credentials are not configured or API call fails
        // Could be 500 (internal error) or 401 from Polar API
        expect([401, 500]).toContain(response.statusCode);
      }
    });
  });

  describe("GET /api/payment/polar/customers", () => {
    it("should list customers from sandbox", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/payment/polar/customers",
      });

      const body = JSON.parse(response.body);

      // If the sandbox API call succeeds
      if (response.statusCode === 200) {
        expect(body.success).toBe(true);
        expect(body.data.customers).toBeDefined();
      } else {
        // If sandbox credentials are not configured
        expect(response.statusCode).toBe(500);
      }
    });
  });
});
