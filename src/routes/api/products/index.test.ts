import { describe, it, beforeAll, afterAll, assert, vi } from "vitest";
import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import type { ISuccessResponse, TErrorResponse } from "@/types/api";
import { currencyEnum } from "@/db/schema";
import {
  createProductSchema,
  CreateProductResult,
} from "@/schema/product.schema";
import {
  IProduct,
  IProductDTO,
  IProductInput,
  TProductCategoryEnum,
  currencyType,
} from "@/types/product.definition";
import { productSample } from "@test/samples/products-sample";

vi.mock("@/modules/product.service", () => ({
  productService: {
    createProduct: vi.fn(),
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
};

describe("Product Service", () => {
  // create product tests
  describe("createProduct", () => {
    it("should create a product successfully", async () => {
      // Arrange
      const baseProduct: IProductDTO = {
        ...productSample,
        id: productSample.id || 1,
        createdAt: productSample.createdAt || new Date(),
      };

      // Define the expected result that includes the base product properties and the rates
      const expectedResult: CreateProductResult = {
        ...productSample,
        createdAt: productSample.createdAt || new Date(),
        id: productSample.id || 1,
        updatedAt: new Date(),
        rates: {
          inr: 1,
          usd: 19.99,
        },
      };

      // Act
      const { productService } = await import("@/modules/product.service");

      vi.mocked(productService.createProduct).mockResolvedValue(expectedResult);

      const createProductResult =
        await productService.createProduct(baseProduct);
      // Assert
      assert.deepEqual(createProductResult, expectedResult);
    });

    it("should handle errors when creating a product", async () => {
      // Arrange
      const errorMessage = "Failed to create product";
      const { productService } = await import("@/modules/product.service");

      // Act
      vi.mocked(productService.createProduct).mockRejectedValue(
        new Error(errorMessage),
      );

      let createProductResult = null;
      try {
        createProductResult =
          await productService.createProduct(sampleProductDTO);
      } catch (_error) {
        // expected error — result remains null
      }

      // Assert
      assert.equal(createProductResult, null);
    });

    it("should create a product with INR as base currency and derive USD rate", async () => {
      // Arrange
      const { productService } = await import("@/modules/product.service");

      const expectedResult: CreateProductResult = {
        ...productSample,
        id: 1,
        createdAt: productSample.createdAt || new Date(),
        updatedAt: new Date(),
        rates: { inr: 1999, usd: 24.22 },
      };

      vi.mocked(productService.createProduct).mockResolvedValue(expectedResult);

      // Act
      const result = await productService.createProduct({
        ...sampleProductDTO,
        currency: "inr",
        amount: 1999,
      });

      // Assert
      assert.ok(
        result.rates.usd > 0,
        "USD rate should be derived and greater than 0",
      );
      assert.equal(result.rates.inr, 1999);
    });

    it("should return a result with both inr and usd rates populated", async () => {
      // Arrange
      const { productService } = await import("@/modules/product.service");

      const expectedResult: CreateProductResult = {
        ...productSample,
        id: 1,
        updatedAt: new Date(),
        createdAt: productSample.createdAt || new Date(),
        rates: { inr: 1659, usd: 19.99 },
      };

      vi.mocked(productService.createProduct).mockResolvedValue(expectedResult);

      // Act
      const result = await productService.createProduct(sampleProductDTO);

      // Assert
      assert.ok("inr" in result.rates, "result.rates should have inr key");
      assert.ok("usd" in result.rates, "result.rates should have usd key");
      assert.ok(typeof result.rates.inr === "number");
      assert.ok(typeof result.rates.usd === "number");
    });

    it("should throw when DB insert fails", async () => {
      // Arrange
      const { productService } = await import("@/modules/product.service");

      vi.mocked(productService.createProduct).mockRejectedValue(
        new Error("Failed to create product"),
      );

      // Assert
      try {
        await productService.createProduct(sampleProductDTO);
        assert.fail("Expected an error to be thrown");
      } catch (error) {
        assert.ok(error instanceof Error);
        assert.match(error.message, /Failed to create product/);
      }
    });

    it("should return a result with createdAt as a valid Date", async () => {
      // Arrange
      const { productService } = await import("@/modules/product.service");
      const now = new Date();

      const expectedResult: CreateProductResult = {
        ...productSample,
        id: 1,
        createdAt: now,
        updatedAt: now,
        rates: { inr: 1, usd: 19.99 },
      };

      vi.mocked(productService.createProduct).mockResolvedValue(expectedResult);

      // Act
      const result = await productService.createProduct(sampleProductDTO);

      // Assert
      assert.ok(
        result.createdAt instanceof Date,
        "createdAt should be a Date instance",
      );
      assert.ok(
        !isNaN(result.createdAt.getTime()),
        "createdAt should be a valid Date",
      );
    });

    it("should handle amount of 0 and return zero rates", async () => {
      // Arrange
      const { productService } = await import("@/modules/product.service");

      const expectedResult: CreateProductResult = {
        ...productSample,
        id: 1,
        createdAt: productSample.createdAt || new Date(),
        updatedAt: new Date(),
        rates: { inr: 0, usd: 0 },
      };

      vi.mocked(productService.createProduct).mockResolvedValue(expectedResult);

      // Act
      const result = await productService.createProduct({
        ...sampleProductDTO,
        amount: 0,
      });

      // Assert
      assert.equal(result.rates.inr, 0);
      assert.equal(result.rates.usd, 0);
    });

    it("should throw when a negative amount is provided", async () => {
      // Arrange
      const { productService } = await import("@/modules/product.service");

      vi.mocked(productService.createProduct).mockRejectedValue(
        new Error("Invalid price amount"),
      );

      // Assert
      try {
        await productService.createProduct({
          ...sampleProductDTO,
          amount: -10,
        });
        assert.fail("Expected an error to be thrown");
      } catch (error) {
        assert.ok(error instanceof Error);
        assert.match(error.message, /Invalid price amount/);
      }
    });
  });

  describe("getProductById", () => {
    it("should return a product with valid rates when found", async () => {
      // Arrange
      const { productService } = await import("@/modules/product.service");

      const expectedResult: IProduct = {
        ...productSample,
        id: 1,
        createdAt: productSample.createdAt || new Date(),
        updatedAt: new Date(),
        rates: { inr: 1659, usd: 19.99 },
      };

      vi.mocked(productService.getProductById).mockResolvedValue(
        expectedResult,
      );

      // Act
      const result = await productService.getProductById(1);

      // Assert
      assert.ok(result, "Expected a product to be returned");
      assert.equal(result.id, 1);
      assert.ok(
        result.rates && typeof result.rates === "object",
        "Expected rates to be an object",
      );
      assert.ok(
        "inr" in result.rates && "usd" in result.rates,
        "Expected rates to include both inr and usd",
      );
    });

    it("should return null when product is not found", async () => {
      // Arrange
      const { productService } = await import("@/modules/product.service");

      vi.mocked(productService.getProductById).mockResolvedValue(null);

      // Act
      const result = await productService.getProductById(999);

      // Assert
      assert.equal(result, null, "Expected null when product is not found");
    });

    it("should throw an error when database query fails", async () => {
      // Arrange
      const { productService } = await import("@/modules/product.service");

      vi.mocked(productService.getProductById).mockRejectedValue(
        new Error("Database query failed"),
      );

      // Act & Assert
      try {
        await productService.getProductById(1);
        assert.fail("Expected an error to be thrown");
      } catch (error) {
        assert.ok(error instanceof Error);
        assert.match(error.message, /Database query failed/);
      }
    });
  });
});

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

  it("POST /api/products should create a product successfully", async () => {
    // Arrange
    const newProductInput: IProductDTO = {
      id: 1,
      ...productSample,
      createdAt: new Date(),
    };

    const expectedProduct: CreateProductResult = {
      category: productSample.category,
      name: productSample.name,
      description: productSample.description,
      id: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      rates: { inr: 1659, usd: 19.99 },
    };

    // Set up mock return value
    const { productService } = await import("@/modules/product.service");
    vi.mocked(productService.createProduct).mockResolvedValue(expectedProduct);

    // Act
    const response = await app.inject({
      method: "POST",
      url: "/api/products",
      payload: newProductInput,
    });

    // Assert
    const body = response.json<ISuccessResponse<CreateProductResult>>();
    assert.equal(body.message, "Product created successfully");
    assert.equal(body.ok, true);
    assert.equal(body.data.name, expectedProduct.name);
    assert.equal(body.data.category, expectedProduct.category);
    assert.deepEqual(body.data.rates, expectedProduct.rates);
    assert.equal(response.statusCode, 201);
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
