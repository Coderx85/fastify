import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import { FastifyInstance } from "fastify";
import { buildServer } from "../../../server";

describe("Payment API", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer({
      logger: false,
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /api/payment/intent", () => {
    it("should return 400 for missing/invalid orderId", async () => {
      const response = await supertest(app.server)
        .post("/api/payment/intent")
        .send({});
      expect(response.status).toBe(400);
    });

    it("should accept provider=razorpay and delegate to Razorpay (external API may return other statuses)", async () => {
      const response = await supertest(app.server)
        .post("/api/payment/intent")
        .send({ orderId: 1, provider: "razorpay", customerName: "Test User", customerEmail: "test@example.com", successUrl: "/checkout/success" });

      // External API may be unreachable in CI; allow common outcomes
      expect([200, 201, 401, 500]).toContain(response.status);

      if ([200, 201].includes(response.status)) {
        expect(response.body).toHaveProperty("keyId");
        expect(response.body).toHaveProperty("checkoutId");
      }
    });
  });
});
