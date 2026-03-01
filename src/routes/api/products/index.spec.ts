import {
  describe,
  it,
  beforeAll,
  beforeEach,
  afterAll,
  assert,
  vi,
} from "vitest";
import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import type { ISuccessResponse, TErrorResponse } from "@/types/api";
import { IProduct } from "@/modules/products/product.definition";
import {
  productSample,
  rateMapSample,
  sampleDate,
} from "@test/samples/products-sample";

// Mock the product service module for api route tests
vi.mock("@/modules/products/product.service", () => ({
  productService: {
    createProduct: vi.fn(),
    getProducts: vi.fn(),
    getProductById: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
  },
}));

const sampleCreatePayload = {
  name: "Sample Product",
  description: "This is a sample product",
  category: "Books", // Use the first category value for testing
  amount: 19.99,
  currency: "inr",
};

// Use original product service implementation for non-mocked methods

describe("/api/products route", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify();
    const { default: productsRoute } = await import("./index");
    const { serializerCompiler, validatorCompiler } =
      await import("fastify-type-provider-zod");

    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    await app.register(productsRoute, { prefix: "/api/products" });
    await app.ready();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/products create product Successfully", () => {
    it("Code - 201 | CREATE A PRODUCT SUCCESSFULLY", async () => {
      // Arrange
      const newProductInput = { ...sampleCreatePayload };

      const expectedProduct: IProduct = {
        id: 1,
        ...productSample,
        rates: rateMapSample,
        updatedAt: null,
      };

      // Set up mock return value
      const { productService } =
        await import("@/modules/products/product.service");

      vi.mocked(productService.createProduct).mockResolvedValue(
        expectedProduct,
      );

      // Act
      const response = await app.inject({
        method: "POST",
        url: "/api/products",
        payload: newProductInput,
      });

      // Assert
      const body = response.json<ISuccessResponse<IProduct>>();
      assert.equal(body.message, "Product created successfully");
      assert.equal(body.ok, true);
      assert.equal(body.data.name, expectedProduct.name);
      assert.equal(body.data.category, expectedProduct.category);
      assert.deepEqual(body.data.rates, expectedProduct.rates);
      assert.equal(response.statusCode, 201);
    });

    it("Code - 409 | CONFLICT when product with same name exists", async () => {
      // Arrange
      const { productService } =
        await import("@/modules/products/product.service");

      vi.mocked(productService.createProduct).mockRejectedValue(
        new Error("Product with the same name already exists.", {
          cause: { code: "CONFLICT" },
        }),
      );

      // Act
      const response = await app.inject({
        method: "POST",
        url: "/api/products",
        payload: sampleCreatePayload,
      });

      // Assert
      assert.equal(response.statusCode, 409);
      const body = response.json<TErrorResponse>();
      assert.equal(
        body.error,
        "CONFLICT",
        "Expected error code to be CONFLICT",
      );
      assert.equal(body.message, "Product with the same name already exists.");
    });

    it("POST /api/products should handle errors gracefully", async () => {
      // Arrange
      const invalidProductInput = {
        ...sampleCreatePayload,
        amount: -10, // Invalid negative amount
      };

      // Act
      const response = await app.inject({
        method: "POST",
        url: "/api/products",
        payload: invalidProductInput,
      });

      // Assert
      assert.equal(response.statusCode, 400);
      const body = response.json<TErrorResponse>();
      assert.equal(body.statusCode, 400);
      assert.equal(body.error, "Bad Request");
    });
  });

  // describe("GET /api/products should return products successfully", () => {});

  describe("GET /api/products/:id should return a single product successfully", () => {
    it("should return a product when found", async () => {
      // Arrange
      const expectedProduct: IProduct = {
        ...productSample,
        updatedAt: null,
        id: 1,
        createdAt: sampleDate,
        rates: { inr: 1659, usd: 19.99 },
      };

      const { productService } =
        await import("@/modules/products/product.service");
      vi.mocked(productService.getProductById).mockResolvedValue(
        expectedProduct,
      );

      // Act
      const response = await app.inject({
        method: "GET",
        url: "/api/products/1",
      });

      // Assert
      assert.equal(response.statusCode, 200);
      const body = response.json<ISuccessResponse<{ product: IProduct }>>();
      assert.equal(body.message, "Product fetched successfully");
      assert.equal(body.ok, true);
      assert.equal(body.data.product.id, expectedProduct.id);
      assert.equal(body.data.product.name, expectedProduct.name);
      assert.equal(body.data.product.category, expectedProduct.category);
      assert.deepEqual(body.data.product.rates, expectedProduct.rates);
    });

    it("should return 404 when product is not found", async () => {
      // Arrange
      const { productService } =
        await import("@/modules/products/product.service");
      vi.mocked(productService.getProductById).mockResolvedValue(null);

      // Act
      const response = await app.inject({
        method: "GET",
        url: "/api/products/999", // Non-existent product ID
      });

      // Assert
      assert.equal(response.statusCode, 404);
      const body = response.json<TErrorResponse>();
      assert.equal(body.error, "NOT_FOUND");
      assert.equal(body.message, "Product with ID 999 not found");
    });

    it("should return 500 when there is a server error", async () => {
      // Arrange
      const { productService } =
        await import("@/modules/products/product.service");
      vi.mocked(productService.getProductById).mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const response = await app.inject({
        method: "GET",
        url: "/api/products/1",
      });

      // Assert
      assert.equal(response.statusCode, 500);
      const body = response.json<TErrorResponse>();
      assert.equal(body.error, "INTERNAL_SERVER_ERROR");
      assert.equal(body.message, "Failed to fetch product");
    });
  });

  describe("DELETE /api/products/:productId delete product", () => {
    it("Code - 404 | NOT_FOUND when product does not exist", async () => {
      // Arrange
      const { productService } =
        await import("@/modules/products/product.service");
      vi.mocked(productService.deleteProduct).mockRejectedValue(
        new Error("Product with ID 999 not found", {
          cause: { code: "NOT_FOUND" },
        }),
      );

      // Act
      const response = await app.inject({
        method: "DELETE",
        url: "/api/products/999",
      });

      // Assert
      assert.equal(response.statusCode, 404);
      const body = response.json<TErrorResponse>();
      assert.equal(body.error, "NOT_FOUND");
      assert.equal(body.message, "Product with ID 999 not found");
    });

    it("Code - 500 | INTERNAL_SERVER_ERROR on unexpected failure", async () => {
      // Arrange
      const { productService } =
        await import("@/modules/products/product.service");
      vi.mocked(productService.deleteProduct).mockRejectedValue(
        new Error("Database connection lost"),
      );

      // Act
      const response = await app.inject({
        method: "DELETE",
        url: "/api/products/1",
      });

      // Assert
      assert.equal(response.statusCode, 500);
      const body = response.json<TErrorResponse>();
      assert.equal(body.error, "INTERNAL_SERVER_ERROR");
      assert.equal(body.message, "Failed to delete product");
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
