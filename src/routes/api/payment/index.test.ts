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
    it("should return 404 Not Found because it is not implemented yet", async () => {
      const response = await supertest(app.server)
        .post("/api/payment/intent")
        .send({ orderId: "123" });
      expect(response.status).toBe(404);
    });
  });
});
