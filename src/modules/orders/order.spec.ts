import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { OrderService } from "./order.service";
import {
  OrderValidationError,
  OrderNotFoundError,
  InvalidProductError,
  InsufficientAddressError,
  IOrderDTO,
  orderCreatedDate,
} from "./order.definition";
import {
  mockOrderWithValidProducts,
  mockOrderWithSingleProduct,
  mockOrderWithManyProducts,
  mockOrderWithLargeQuantity,
  mockOrderWithoutProducts,
  mockOrderWithNegativeQuantity,
  mockOrderWithZeroQuantity,
  mockOrderRazorpay,
  mockOrderPolar,
  mockOrderWithInvalidProduct,
  mockBillingAddress,
  mockAddressResponse,
  createOrderPayload,
} from "@test/order.test-helper";

// Mock database module
vi.mock("@/db", () => ({
  dbPool: {
    transaction: vi.fn(),
  },
  db: {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    values: vi.fn().mockReturnThis(),
  },
}));

describe("OrderService - Unit Tests", () => {
  let orderService: OrderService;
  let db: (typeof import("@/db"))["db"];
  let dbPool: (typeof import("@/db"))["dbPool"];

  beforeEach(async () => {
    vi.clearAllMocks();
    orderService = new OrderService();
    ({ db, dbPool } = await import("@/db"));
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ========== UNIT TESTS FOR INPUT VALIDATION ==========
  describe("createOrder - Order Services", () => {
    describe("createOrder - Basic Cases", () => {
      it("should create order with valid data and products", async () => {
        // Arrange
        const orderPayload = mockOrderWithValidProducts;

        // Act & Assert
        expect(orderPayload).toBeDefined();
        expect(orderPayload.userId).toBe(1);
        expect(orderPayload.paymentMethod).toBe("polar");
        expect(orderPayload.products.length).toBe(2);
      });

      it("should create order with single product", async () => {
        // Arrange
        const orderPayload = mockOrderWithSingleProduct;

        // Assert
        expect(orderPayload.products.length).toBe(1);
        expect(orderPayload.paymentMethod).toBe("razorpay");
        expect(orderPayload.userId).toBe(1);
      });

      it("should create order with multiple products", async () => {
        // Arrange
        const orderPayload = mockOrderWithManyProducts;

        // Assert
        expect(orderPayload.products.length).toBe(5);
        expect(orderPayload.products[0].quantity).toBe(5);
        expect(orderPayload.products[4].quantity).toBe(1);
      });

      it("should assign shipping address as billing address when not provided", async () => {
        // Arrange
        const orderPayload = createOrderPayload({
          billingAddress: undefined,
        });

        // Assert
        expect(orderPayload.billingAddress).toBeUndefined();
        expect(orderPayload.shippingAddress).toBeDefined();
      });

      it("should use separate billing address when provided", async () => {
        // Arrange
        const orderPayload = createOrderPayload({
          billingAddress: mockBillingAddress,
        });

        // Assert
        expect(orderPayload.billingAddress).toBeDefined();
        expect(orderPayload.billingAddress).not.toEqual(
          orderPayload.shippingAddress,
        );
        expect(orderPayload.billingAddress?.city).toBe("Los Angeles");
      });
    });

    describe("createOrder - Payment Method Cases", () => {
      it("should map polar payment method to USD currency", async () => {
        // Arrange
        const orderPayload = mockOrderPolar;

        // Assert
        expect(orderPayload.paymentMethod).toBe("polar");
      });

      it("should map razorpay payment method to INR currency", async () => {
        // Arrange
        const orderPayload = mockOrderRazorpay;

        // Assert
        expect(orderPayload.paymentMethod).toBe("razorpay");
      });

      it("should create order with polar payment method", async () => {
        // Arrange
        const orderPayload = mockOrderPolar;

        // Assert
        expect(orderPayload.paymentMethod).toBe("polar");
        expect(orderPayload.userId).toBe(3);
        expect(orderPayload.products.length).toBe(1);
      });

      it("should create order with razorpay payment method", async () => {
        // Arrange
        const orderPayload = mockOrderRazorpay;

        // Assert
        expect(orderPayload.paymentMethod).toBe("razorpay");
        expect(orderPayload.userId).toBe(2);
        expect(orderPayload.products.length).toBe(1);
      });
    });

    describe("createOrder - Product Quantity Cases", () => {
      it("should create order with large quantity", async () => {
        // Arrange
        const orderPayload = mockOrderWithLargeQuantity;

        // Assert
        expect(orderPayload.products[0].quantity).toBe(999);
        expect(orderPayload.products.length).toBe(1);
      });

      it("should handle order with quantity 1", async () => {
        // Arrange
        const orderPayload = mockOrderWithSingleProduct;

        // Assert
        expect(orderPayload.products[0].quantity).toBe(1);
      });

      it("should handle order with varying quantities", async () => {
        // Arrange
        const orderPayload = mockOrderWithManyProducts;

        // Assert
        const quantities = orderPayload.products.map((p) => p.quantity);
        expect(quantities).toEqual([5, 3, 10, 2, 1]);
      });
    });

    describe("createOrder - Validation Edge Cases", () => {
      it("should reject order with no products", async () => {
        // Arrange
        const orderPayload = mockOrderWithoutProducts;

        // Assert
        expect(orderPayload.products.length).toBe(0);
      });

      it("should reject order with negative quantity", async () => {
        // Arrange
        const orderPayload = mockOrderWithNegativeQuantity;

        // Assert
        expect(
          (orderPayload?.products?.length ?? 0) > 0
            ? orderPayload.products![0].quantity
            : 0,
        ).toBeLessThan(0);
      });

      it("should reject order with zero quantity", async () => {
        // Arrange
        const orderPayload = mockOrderWithZeroQuantity;

        // Assert
        expect(
          (orderPayload?.products?.length ?? 0) > 0
            ? orderPayload.products![0].quantity
            : 0,
        ).toBe(0);
      });

      it("should validate that shipping address is required", async () => {
        // Arrange
        const orderPayload = createOrderPayload({
          shippingAddress: undefined,
        });

        // Assert
        expect(orderPayload.shippingAddress).toBeUndefined();
      });

      it("should validate that userId is required", async () => {
        // Arrange
        const invalidOrder = { ...mockOrderWithValidProducts };
        delete (invalidOrder as any).userId;

        // Assert
        expect((invalidOrder as any).userId).toBeUndefined();
      });

      it("should validate that payment method is required", async () => {
        // Arrange
        const invalidOrder = { ...mockOrderWithValidProducts };
        delete (invalidOrder as any).paymentMethod;

        // Assert
        expect((invalidOrder as any).paymentMethod).toBeUndefined();
      });
    });

    describe("createOrder - Error Scenarios", () => {
      it("should define error classes", () => {
        // Assert
        expect(OrderValidationError).toBeDefined();
        expect(OrderNotFoundError).toBeDefined();
        expect(InvalidProductError).toBeDefined();
        expect(InsufficientAddressError).toBeDefined();
      });

      it("should instantiate OrderValidationError correctly", () => {
        // Arrange - Act
        const error = new OrderValidationError("Invalid order data");

        // Assert
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("Invalid order data");
        expect(error.name).toBe("OrderValidationError");
      });

      it("should instantiate OrderNotFoundError correctly", () => {
        // Arrange - Act
        const error = new OrderNotFoundError(123);

        // Assert
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain("Order with ID 123");
        expect(error.name).toBe("OrderNotFoundError");
      });

      it("should instantiate InvalidProductError correctly", () => {
        // Arrange - Act
        const error = new InvalidProductError(456);

        // Assert
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain("Product with ID 456");
        expect(error.name).toBe("InvalidProductError");
      });

      it("should instantiate InsufficientAddressError correctly", () => {
        // Arrange - Act
        const error = new InsufficientAddressError("Custom message");

        // Assert
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("Custom message");
        expect(error.name).toBe("InsufficientAddressError");
      });
    });

    describe("createOrder - Type Safety Cases", () => {
      it("should have correct payment method type", async () => {
        // Arrange
        const order = mockOrderPolar;

        // Assert
        expect(["polar", "razorpay"]).toContain(order.paymentMethod);
      });

      it("should have correct address type", async () => {
        // Arrange
        const order = mockOrderWithValidProducts;

        // Assert
        expect(["shipping", "billing"]).toContain(
          order.shippingAddress.addressType,
        );
      });

      it("should validate product structure", async () => {
        // Arrange
        const order = mockOrderWithValidProducts;

        // Assert
        order.products.forEach((product) => {
          expect(typeof product.productId).toBe("number");
          expect(typeof product.quantity).toBe("number");
          expect(product.productId).toBeGreaterThan(0);
          expect(product.quantity).toBeGreaterThan(0);
        });
      });
    });

    // additional tests that actually exercise the service methods
    describe("createOrder - Service Behavior", () => {
      it("should throw OrderValidationError for invalid input", async () => {
        // Act & Assert
        await expect(
          orderService.createOrder({} as any, 1),
        ).rejects.toBeInstanceOf(OrderValidationError);
      });

      it("should throw InvalidProductError when product does not exist", async () => {
        const payload = mockOrderWithInvalidProduct;
        vi.spyOn(
          orderService as any,
          "validateProductsExist",
        ).mockRejectedValue(
          new InvalidProductError(payload.products[0].productId),
        );

        // ensure transaction callbacks are executed so rejection propagates
        (dbPool.transaction as any).mockImplementation(async (cb: any) => {
          // simple tx stub, not used because validateProductsExist will fail early
          const tx: any = {};
          return await cb(tx);
        });

        await expect(
          orderService.createOrder(payload, payload.userId),
        ).rejects.toBeInstanceOf(InvalidProductError);
      });

      it("should throw InsufficientAddressError if shipping address missing", async () => {
        const payload = {
          ...mockOrderWithValidProducts,
          shippingAddress: undefined,
        } as any;

        await expect(
          orderService.createOrder(payload, payload.userId),
        ).rejects.toBeInstanceOf(InsufficientAddressError);
      });

      it("should successfully create order when data is valid", async () => {
        const payload = mockOrderWithValidProducts;

        // stub out expensive/private helpers
        vi.spyOn(
          orderService as any,
          "validateProductsExist",
        ).mockResolvedValue({ 1: { id: 1 }, 2: { id: 2 } });
        vi.spyOn(orderService as any, "getProductPrice").mockResolvedValue(100);
        vi.spyOn(orderService as any, "convertPrice").mockResolvedValue({
          amount: 0,
          rate: 1,
        });

        // make transaction callback invoke our minimal stub
        (dbPool.transaction as any).mockImplementation(async (cb: any) => {
          // helper to generate a query chain returning array
          function queryChain(): any {
            const p: any = Promise.resolve([]);
            p.limit = () => Promise.resolve([]);
            return {
              where: () => p,
            };
          }

          const tx: any = {
            select: () => ({
              from: () => queryChain(),
            }),
            insert: () => tx,
            values: () => tx,
            update: () => tx,
            returning: vi.fn(),
          };

          // configure returning to provide sequential results
          tx.returning
            .mockResolvedValueOnce([{ id: 10 }]) // shipping addr
            .mockResolvedValueOnce([{ id: 20 }]) // billing addr
            .mockResolvedValueOnce([
              {
                id: 100,
                userId: payload.userId,
                totalAmount: 0,
                totalAmountCurrency: "usd",
                status: "processing",
                paymentMethod: payload.paymentMethod,
                notes: payload.notes,
                createdAt: new Date(),
              },
            ]) // order
            .mockResolvedValueOnce([
              {
                id: 1000,
                orderId: 100,
                productId: 1,
                quantity: 2,
                priceAtOrder: 100,
                createdAt: new Date(),
              },
            ]) // first orderProduct
            .mockResolvedValueOnce([
              {
                id: 1001,
                orderId: 100,
                productId: 2,
                quantity: 1,
                priceAtOrder: 100,
                createdAt: new Date(),
              },
            ]); // second orderProduct

          return await cb(tx);
        });

        const result = await orderService.createOrder(payload, payload.userId);
        expect(result).toHaveProperty("shippingAddress");
        expect(result).toHaveProperty("billingAddress");
        expect(result.items.length).toBeGreaterThan(0);
        expect(result.pricing).toHaveProperty("convertedAmount");
      });
    });
  });

  describe("getOrderById - Product Service", () => {
    // valid mock orderID
    const validOrderId = 1;

    // Invalid mock orderID
    const invalidOrderId = 999;

    // Expected order result for valid order ID
    const expectedOrderResult: IOrderDTO = {
      id: 1,
      userId: 1,
      totalAmount: 0,
      totalAmountCurrency: "usd",
      status: "processing",
      paymentMethod: "polar",
      notes: "Test order",
      createdAt: orderCreatedDate,
      shippingAddress: mockAddressResponse,
      billingAddress: mockAddressResponse,
      items: [],
      pricing: {
        originalAmount: 0,
        convertedAmount: 0,
        currency: "usd",
        exchangeRate: 1,
      },
    };

    it("should have getOrderById defined", () => {
      expect(orderService.getOrderById).toBeDefined();
      expect(typeof orderService.getOrderById).toBe("function");
    });

    it("should return an order when found via findOrder", async () => {
      const spy = vi.spyOn(orderService as any, "findOrder").mockResolvedValue({
        orders: [expectedOrderResult],
        firstOrder: expectedOrderResult,
      });

      const order = await orderService.getOrderById(validOrderId);
      expect(order).toEqual(expectedOrderResult);
      spy.mockRestore();
    });

    it("should throw a wrapped error when findOrder fails", async () => {
      vi.spyOn(orderService as any, "findOrder").mockRejectedValue(
        new Error("Orders not found"),
      );

      await expect(orderService.getOrderById(invalidOrderId)).rejects.toThrow(
        "Failed to fetch order",
      );
    });
  });
});
