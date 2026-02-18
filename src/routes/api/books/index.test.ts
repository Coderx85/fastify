import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import { FastifyInstance } from "fastify";
import { buildServer } from "../../../server";

describe("Books API", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/books should return books list", async () => {
    const res = await supertest(app.server).get("/api/books");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toHaveProperty("products");
    expect(Array.isArray(res.body.data.products)).toBe(true);
    // ensure every returned item is in Books category
    for (const p of res.body.data.products) {
      expect(p.category).toBe("Books");
    }
  });

  it("GET /api/books/:bookId should return a single book", async () => {
    // productId 103 exists in sample data and has category 'Books'
    const res = await supertest(app.server).get("/api/books/103");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.product).toBeDefined();
    expect(res.body.data.product.productId).toBe(103);
    expect(res.body.data.product.category).toBe("Books");
  });
});
