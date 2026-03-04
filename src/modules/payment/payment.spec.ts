import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { PaymentService } from "./payment.service";
import {
  UnsupportedCurrencyError,
  PaymentValidationError,
  WebhookVerificationError,
} from "./payment.definition";
import type { IOrderInput } from "@/modules/orders/order.definition";

// prevent the real DB client from initializing (razorpay.service imports it)
vi.mock("@/db", () => ({
  dbPool: { transaction: vi.fn() },
  db: {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
  },
}));

// stub razorpay service
vi.mock("./razorpay.service", () => ({
  razorpayService: {
    createOrder: vi.fn(),
    verifyWebhookSignature: vi.fn(),
    markPaymentSucceeded: vi.fn(),
  },
}));

// create dummy order input for tests
const dummyOrder: IOrderInput = {
  userId: 1,
  paymentMethod: "razorpay",
  totalAmountCurrency: "inr",
  totalAmount: 5000,
  shippingAddress: {
    streetAddress1: "123 Main St",
    streetAddress2: "",
    city: "Testville",
    state: "TS",
    postalCode: "12345",
    country: "IN",
  },
  billingAddress: {
    streetAddress1: "123 Main St",
    streetAddress2: "",
    city: "Testville",
    state: "TS",
    postalCode: "12345",
    country: "IN",
  },
  products: [{ productId: 10, quantity: 2 }],
};

describe("PaymentService", () => {
  let fakeRazor: any;
  let fakeOrderService: any;
  let service: PaymentService;

  beforeEach(() => {
    fakeRazor = {
      createOrder: vi
        .fn()
        .mockResolvedValue({ order: { id: "r1" }, internalOrderId: 5 }),
      verifyWebhookSignature: vi.fn().mockReturnValue(true),
      markPaymentSucceeded: vi.fn().mockResolvedValue(undefined),
    };

    fakeOrderService = {
      createOrder: vi.fn().mockResolvedValue({}),
    };

    // use dependency injection so we can pass our mocks
    service = new PaymentService(fakeRazor, fakeOrderService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Service One - initiatePayment tests
  describe("initiatePayment", () => {
    it("throws validation error when args missing", async () => {
      // @ts-expect-error intentionally missing
      await expect(service.initiatePayment(undefined, NaN)).rejects.toThrow(
        PaymentValidationError,
      );
    });

    it("selects razorpay when currency is INR", async () => {
      // vi.spyOn(currencyService, "getCurrencyByPaymentMethod").mockReturnValue(
      //   "inr",
      // );
      const result = await service.initiatePayment(dummyOrder, 42);
      expect(fakeRazor.createOrder).toHaveBeenCalled();
      const [[, opts]] = fakeRazor.createOrder.mock.calls;
      expect(opts.metadata?.orderPayload).toBeDefined();
      expect(result.provider).toBe("razorpay");
      expect(result.providerOrderId).toBe("r1");
    });

    it("selects razorpay with USD when currency is USD", async () => {
      const usdOrder = { ...dummyOrder, totalAmountCurrency: "usd" as const };
      const result = await service.initiatePayment(usdOrder as any, 99);
      expect(fakeRazor.createOrder).toHaveBeenCalled();
      const [[, opts]] = fakeRazor.createOrder.mock.calls;
      expect(opts.metadata?.currency).toBe("USD");
      expect(result.provider).toBe("razorpay");
    });

    it("rejects unsupported currency", async () => {
      const audOrder = { ...dummyOrder, totalAmountCurrency: "aud" as any };
      await expect(service.initiatePayment(audOrder as any, 1)).rejects.toThrow(
        UnsupportedCurrencyError,
      );
    });
  });

  // Service Two - handleRazorpayWebhook tests
  describe("handleRazorpayWebhook", () => {
    it("verifies signature and creates order", async () => {
      const metadata = { orderInput: dummyOrder, userId: 7 };
      const rawPayload = JSON.stringify({
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              order_id: "r1",
              notes: { orderPayload: JSON.stringify(metadata) },
            },
          },
        },
      });

      await service.handleRazorpayWebhook(rawPayload, "sig");

      expect(fakeRazor.verifyWebhookSignature).toHaveBeenCalledWith(
        rawPayload,
        "sig",
      );
      expect(fakeOrderService.createOrder).toHaveBeenCalledWith(
        metadata.orderInput,
        7,
      );
      expect(fakeRazor.markPaymentSucceeded).toHaveBeenCalledWith("r1");
    });

    it("throws when signature invalid", async () => {
      fakeRazor.verifyWebhookSignature.mockReturnValue(false);
      await expect(service.handleRazorpayWebhook("{}", "x")).rejects.toThrow(
        WebhookVerificationError,
      );
    });
  });
});
