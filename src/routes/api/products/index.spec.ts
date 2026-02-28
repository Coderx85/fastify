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
import {
  IProduct,
  IProductDTO,
  IProductInput,
} from "@/modules/products/product.definition";
import { productSample } from "@test/samples/products-sample";

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

// Mock the productService.createProduct method to return a sample product DTO
const sampleProductDTO: IProductInput = {
  id: 1,
  name: "Sample Product",
  description: "This is a sample product",
  category: "Books", // Use the first category value for testing
  amount: 19.99,
  currency: "inr",
  createdAt: new Date(),
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
      const newProductInput: IProductDTO = {
        id: 1,
        ...productSample,
        createdAt: new Date(),
      };

      const expectedProduct: IProduct = {
        id: 1,
        category: productSample.category,
        name: productSample.name,
        description: productSample.description,
        createdAt: new Date(),
        updatedAt: new Date(),
        rates: { inr: 1659, usd: 19.99 },
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
        payload: sampleProductDTO,
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
        ...sampleProductDTO,
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
        id: 1,
        createdAt: productSample.createdAt || new Date(),
        updatedAt: new Date(),
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

  // it("GET /api/products should return products successfully", async () => {
  //   // Arrange
  //   const { productService } = await import("@/modules/product.service");

  //   const expectedProducts = [
  //     {
  //       ...productSample,
  //       id: 1,
  //       createdAt: productSample.createdAt || new Date(),
  //       updatedAt: new Date(),
  //       rates: { inr: 1659, usd: 19.99 },
  //     },
  //   ];

  //   vi.mocked(productService.getAllProducts).mockResolvedValue(
  //     expectedProducts,
  //   );

  //   // Act
  //   const response = await app.inject({
  //     method: "GET",
  //     url: "/api/products",
  //   });

  //   // Assert
  //   assert.equal(response.statusCode, 200);
  //   const body = response.json<ISuccessResponse<{ products: IProduct[] }>>();

  //   assert.ok(body.data);
  //   assert.ok(Array.isArray(body.data.products));
  //   assert.equal(body.data.products.length, expectedProducts.length);
  //   assert.deepEqual(body.data.products[0], expectedProducts[0]);
  // });

  afterAll(async () => {
    await app.close();
  });
});
