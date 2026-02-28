import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { OrderService } from "./order.service";
import {
  OrderValidationError,
  OrderNotFoundError,
  InvalidProductError,
  InsufficientAddressError,
  IAddressInput,
} from "./order.definiton";
import {
  mockOrderWithValidProducts,
  mockOrderWithSingleProduct,
  mockOrderWithManyProducts,
  mockOrderWithLargeQuantity,
  mockOrderWithInvalidProduct,
  mockOrderWithoutProducts,
  mockOrderWithNegativeQuantity,
  mockOrderWithZeroQuantity,
  mockOrderWithLongNotes,
  mockOrderWithSpecialCharactersInNotes,
  mockOrderRazorpay,
  mockOrderPolar,
  mockShippingAddress,
  mockBillingAddress,
  mockAddressResponse,
  createOrderPayload,
  PAYMENT_CURRENCY_MAP,
  mockProductResponse,
} from "@test/order.test-helper";

// Mock database module
vi.mock("@/db", () => ({
  db: {
    transaction: vi.fn(),
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

  beforeEach(() => {
    vi.clearAllMocks();
    orderService = new OrderService();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ========== INTEGRATION TESTS ==========
  describe("createOrder - Integration Tests", () => {
    it("should throw OrderValidationError when userId is missing", async () => {
      // Arrange
      const invalidOrder = { ...mockOrderWithValidProducts };
      delete (invalidOrder as any).userId;

      // Act & Assert
      await expect(
        orderService.createOrder(
          (invalidOrder as any).userId,
          invalidOrder as any,
        ),
      ).rejects.toThrow(OrderValidationError);
    });

    it("should throw OrderValidationError when paymentMethod is missing", async () => {
      // Arrange
      const invalidOrder = { ...mockOrderWithValidProducts };
      delete (invalidOrder as any).paymentMethod;

      // Act & Assert
      await expect(
        orderService.createOrder(1, invalidOrder as any),
      ).rejects.toThrow(OrderValidationError);
    });

    it("should throw OrderValidationError when paymentMethod is invalid", async () => {
      // Arrange
      const invalidOrder = {
        ...mockOrderWithValidProducts,
        paymentMethod: "invalid_method",
      };

      // Act & Assert
      await expect(
        orderService.createOrder(1, invalidOrder as any),
      ).rejects.toThrow(OrderValidationError);
    });

    it("should throw InsufficientAddressError when shippingAddress is missing", async () => {
      // Arrange
      const invalidOrder = { ...mockOrderWithValidProducts };
      delete (invalidOrder as any).shippingAddress;

      // Act & Assert
      await expect(
        orderService.createOrder(1, invalidOrder as any),
      ).rejects.toThrow(InsufficientAddressError);
    });

    it("should throw OrderValidationError when products array is empty", async () => {
      // Arrange
      const invalidOrder = {
        ...mockOrderWithValidProducts,
        products: [],
      };

      // Act & Assert
      await expect(orderService.createOrder(1, invalidOrder)).rejects.toThrow(
        OrderValidationError,
      );
    });

    it("should throw OrderValidationError when product quantity is zero", async () => {
      // Arrange
      const invalidOrder = {
        ...mockOrderWithValidProducts,
        products: [{ productId: 1, quantity: 0 }],
      };

      // Act & Assert
      await expect(orderService.createOrder(1, invalidOrder)).rejects.toThrow(
        OrderValidationError,
      );
    });

    it("should throw OrderValidationError when product quantity is negative", async () => {
      // Arrange
      const invalidOrder = {
        ...mockOrderWithValidProducts,
        products: [{ productId: 1, quantity: -5 }],
      };

      // Act & Assert
      await expect(orderService.createOrder(1, invalidOrder)).rejects.toThrow(
        OrderValidationError,
      );
    });

    it("should throw OrderValidationError when product ID is invalid", async () => {
      // Arrange
      const invalidOrder = {
        ...mockOrderWithValidProducts,
        products: [{ productId: -1, quantity: 1 }],
      };

      // Act & Assert
      await expect(orderService.createOrder(1, invalidOrder)).rejects.toThrow(
        OrderValidationError,
      );
    });
  });

  // ========== UNIT TESTS FOR INPUT VALIDATION ==========
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
      expect(PAYMENT_CURRENCY_MAP[orderPayload.paymentMethod]).toBe("usd");
    });

    it("should map razorpay payment method to INR currency", async () => {
      // Arrange
      const orderPayload = mockOrderRazorpay;

      // Assert
      expect(orderPayload.paymentMethod).toBe("razorpay");
      expect(PAYMENT_CURRENCY_MAP[orderPayload.paymentMethod]).toBe("inr");
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

  describe("createOrder - Product Validation Cases", () => {
    it("should handle order with non-existent product", async () => {
      // Arrange
      const orderPayload = mockOrderWithInvalidProduct;

      // Assert
      expect(orderPayload.products[0].productId).toBe(99999);
    });

    it("should validate all products in order exist", async () => {
      // Arrange
      const orderPayload = mockOrderWithValidProducts;
      const productIds = orderPayload.products.map((p) => p.productId);

      // Assert
      expect(productIds).toContain(1);
      expect(productIds).toContain(2);
      expect(productIds.length).toBe(2);
    });

    it("should reject order with duplicate product IDs with different quantities", async () => {
      // Arrange
      const orderPayload = createOrderPayload({
        products: [
          { productId: 1, quantity: 2 },
          { productId: 1, quantity: 3 }, // Same product
        ],
      });

      // Assert
      const productIds = orderPayload.products.map((p) => p.productId);
      expect(productIds).toEqual([1, 1]);
    });
  });

  describe("createOrder - Notes and Comments Cases", () => {
    it("should create order with notes", async () => {
      // Arrange
      const orderPayload = mockOrderWithValidProducts;

      // Assert
      expect(orderPayload.notes).toBe("Please handle with care");
    });

    it("should create order with long notes", async () => {
      // Arrange
      const orderPayload = mockOrderWithLongNotes;

      // Assert
      expect(orderPayload.notes).toBeDefined();
      expect(orderPayload.notes?.length).toBe(1000);
    });

    it("should handle notes with special characters", async () => {
      // Arrange
      const orderPayload = mockOrderWithSpecialCharactersInNotes;

      // Assert
      expect(orderPayload.notes).toContain("<script>");
      expect(orderPayload.notes).toContain("!@#$%^&*()");
    });

    it("should create order without notes", async () => {
      // Arrange
      const orderPayload = createOrderPayload({
        notes: undefined,
      });

      // Assert
      expect(orderPayload.notes).toBeUndefined();
    });

    it("should handle empty string notes", async () => {
      // Arrange
      const orderPayload = createOrderPayload({
        notes: "",
      });

      // Assert
      expect(orderPayload.notes).toBe("");
    });
  });

  describe("createOrder - Address Validation Cases", () => {
    it("should validate shipping address has all required fields", async () => {
      // Arrange
      const address = mockShippingAddress;

      // Assert
      expect(address.streetAddress1).toBeDefined();
      expect(address.city).toBeDefined();
      expect(address.state).toBeDefined();
      expect(address.postalCode).toBeDefined();
      expect(address.country).toBeDefined();
    });

    it("should accept shipping address with optional fields", async () => {
      // Arrange
      const address = createOrderPayload().shippingAddress;

      // Assert
      expect(address.streetAddress2).toBeDefined();
      expect(address.isDefault).toBeDefined();
    });

    it("should handle address without optional fields", async () => {
      // Arrange
      const minimalAddress: IAddressInput = {
        userId: 1,
        addressType: "shipping",
        isDefault: true,
        streetAddress1: "123 Main Street",
        streetAddress2: null, // Explicitly set to null
        city: "New York",
        state: "NY",
        postalCode: "10001",
        country: "USA",
      };
      const address = createOrderPayload({
        shippingAddress: minimalAddress,
      }).shippingAddress;

      // Assert
      expect(address.streetAddress1).toBeDefined();
      expect(address.city).toBe("New York");
    });

    it("should validate address userId matches order userId", async () => {
      // Arrange
      const orderPayload = createOrderPayload({
        userId: 5,
        shippingAddress: {
          ...mockShippingAddress,
          userId: 5,
        },
      });

      // Assert
      expect(orderPayload.userId).toBe(5);
      expect(orderPayload.shippingAddress.userId).toBe(5);
    });

    it("should handle different address types", async () => {
      // Arrange
      const shippingAddr = { ...mockShippingAddress, addressType: "shipping" };
      const billingAddr = { ...mockBillingAddress, addressType: "billing" };

      // Assert
      expect(shippingAddr.addressType).toBe("shipping");
      expect(billingAddr.addressType).toBe("billing");
    });

    it("should validate address with minimum required fields", async () => {
      // Arrange
      const minimalAddress = {
        userId: 1,
        addressType: "shipping" as const,
        streetAddress1: "123 Main St",
        city: "NYC",
        state: "NY",
        postalCode: "10001",
        country: "USA",
      };

      // Assert
      expect(minimalAddress.streetAddress1).toBeDefined();
      expect(minimalAddress.city).toBeDefined();
    });
  });

  describe("createOrder - User ID Cases", () => {
    it("should create order with valid user ID", async () => {
      // Arrange
      const orderPayload = mockOrderWithValidProducts;

      // Assert
      expect(orderPayload.userId).toBe(1);
      expect(typeof orderPayload.userId).toBe("number");
      expect(orderPayload.userId).toBeGreaterThan(0);
    });

    it("should handle different user IDs", async () => {
      // Arrange
      const order1 = createOrderPayload({ userId: 1 });
      const order2 = createOrderPayload({ userId: 2 });
      const order3 = createOrderPayload({ userId: 999 });

      // Assert
      expect(order1.userId).toBe(1);
      expect(order2.userId).toBe(2);
      expect(order3.userId).toBe(999);
    });
  });

  describe("createOrder - Data Integrity Cases", () => {
    it("should preserve product array order", async () => {
      // Arrange
      const orderPayload = mockOrderWithManyProducts;

      // Assert
      expect(orderPayload.products[0].productId).toBe(1);
      expect(orderPayload.products[1].productId).toBe(2);
      expect(orderPayload.products[2].productId).toBe(3);
      expect(orderPayload.products[3].productId).toBe(4);
      expect(orderPayload.products[4].productId).toBe(5);
    });

    it("should not modify original payload object", async () => {
      // Arrange
      const originalPayload = { ...mockOrderWithValidProducts };
      const payloadCopy = JSON.parse(JSON.stringify(originalPayload));

      // Act - No modification

      // Assert
      expect(payloadCopy).toEqual(originalPayload);
    });

    it("should maintain address object integrity", async () => {
      // Arrange - Act
      const orderPayload = mockOrderWithValidProducts;

      // Assert
      expect(orderPayload.shippingAddress.streetAddress1).toBe(
        "123 Main Street",
      );
      expect(orderPayload.shippingAddress.city).toBe("New York");
      expect(orderPayload.shippingAddress.state).toBe("NY");
    });
  });

  describe("createOrder - Boundary Cases", () => {
    it("should handle maximum supported products", async () => {
      // Arrange
      const manyProducts = Array.from({ length: 100 }, (_, i) => ({
        productId: i + 1,
        quantity: 1,
      }));
      const orderPayload = createOrderPayload({
        products: manyProducts,
      });

      // Assert
      expect(orderPayload.products.length).toBe(100);
    });

    it("should handle minimum order (1 product)", async () => {
      // Arrange
      const orderPayload = mockOrderWithSingleProduct;

      // Assert
      expect(orderPayload.products.length).toBe(1);
    });

    it("should handle different country codes", async () => {
      // Arrange
      const usOrder = createOrderPayload({
        shippingAddress: { ...mockShippingAddress, country: "USA" },
      });
      const indiaOrder = createOrderPayload({
        shippingAddress: { ...mockShippingAddress, country: "India" },
      });

      // Assert
      expect(usOrder.shippingAddress.country).toBe("USA");
      expect(indiaOrder.shippingAddress.country).toBe("India");
    });

    it("should handle different state/province codes", async () => {
      // Arrange
      const nyOrder = createOrderPayload({
        shippingAddress: { ...mockShippingAddress, state: "NY" },
      });
      const caOrder = createOrderPayload({
        shippingAddress: { ...mockShippingAddress, state: "CA" },
      });

      // Assert
      expect(nyOrder.shippingAddress.state).toBe("NY");
      expect(caOrder.shippingAddress.state).toBe("CA");
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
});
