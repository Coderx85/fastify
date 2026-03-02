import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { PaymentService } from "./payment.service";
import { currencyService } from "@/modules/currency/currency.service";
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

// stub razorpay and polar services to avoid network/config in tests
vi.mock("./razorpay.service", () => ({
  razorpayService: {
    createOrder: vi.fn(),
    verifyWebhookSignature: vi.fn(),
    markPaymentSucceeded: vi.fn(),
  },
}));

vi.mock("./polar.service", () => ({
  polarService: {
    createCheckout: vi.fn(),
  },
}));

// create dummy order input for tests
const dummyOrder: IOrderInput = {
  userId: 1,
  paymentMethod: "razorpay", // will be overridden via currencyService stub
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
  let fakePolar: any;
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

    fakePolar = {
      createCheckout: vi.fn().mockResolvedValue({
        checkoutId: "p1",
        checkoutUrl: "https://polar.test",
        status: "active",
      }),
    };

    fakeOrderService = {
      createOrder: vi.fn().mockResolvedValue({}),
    };

    // use dependency injection so we can pass our mocks
    service = new PaymentService(fakeRazor, fakePolar, fakeOrderService);

    // reset currencyService to default mapping before each test
    vi.spyOn(currencyService, "getCurrencyByPaymentMethod").mockImplementation(
      (m) => {
        if (m === "razorpay") return "inr";
        if (m === "polar") return "usd";
        return undefined as any;
      },
    );
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
      vi.spyOn(currencyService, "getCurrencyByPaymentMethod").mockReturnValue(
        "inr",
      );
      const result = await service.initiatePayment(dummyOrder, 42);
      expect(fakeRazor.createOrder).toHaveBeenCalled();
      const [[, opts]] = fakeRazor.createOrder.mock.calls;
      expect(opts.metadata?.orderPayload).toBeDefined();
      expect(result.provider).toBe("razorpay");
      expect(result.providerOrderId).toBe("r1");
    });

    it("selects polar when currency is USD", async () => {
      vi.spyOn(currencyService, "getCurrencyByPaymentMethod").mockReturnValue(
        "usd",
      );
      const result = await service.initiatePayment(dummyOrder, 99);
      expect(fakePolar.createCheckout).toHaveBeenCalled();
      const [[params]] = fakePolar.createCheckout.mock.calls;
      expect(params.metadata?.orderPayload).toBeDefined();
      expect(result.provider).toBe("polar");
      expect(result.checkoutUrl).toBe("https://polar.test");
    });

    it("rejects unsupported currency", async () => {
      vi.spyOn(currencyService, "getCurrencyByPaymentMethod").mockReturnValue(
        "aud" as any,
      );
      await expect(service.initiatePayment(dummyOrder, 1)).rejects.toThrow(
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

  // Service Three - handlePolarWebhook tests
  describe("handlePolarWebhook", () => {
    it("creates order when metadata present on paid event", async () => {
      const metadata = { orderInput: dummyOrder, userId: 13 };
      const payload = {
        type: "order.paid",
        data: { metadata: { orderPayload: JSON.stringify(metadata) } },
      };
      await service.handlePolarWebhook(payload);
      expect(fakeOrderService.createOrder).toHaveBeenCalledWith(
        metadata.orderInput,
        13,
      );
    });

    it("ignores other events", async () => {
      const payload = { type: "customer.created", data: {} };
      await service.handlePolarWebhook(payload);
      expect(fakeOrderService.createOrder).not.toHaveBeenCalled();
    });
  });
});
