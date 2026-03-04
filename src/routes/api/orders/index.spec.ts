import { describe, it, beforeEach, vi, expect } from "vitest";
import { OrderController } from "@/routes/api/orders/handler";
import { sendSuccess, sendError } from "@/lib/response";
import { mockOrderPolar, mockOrderRazorpay } from "@test/order.test-helper";
import type { FastifyReply, FastifyRequest } from "fastify";

// Unit tests for the OrderController to ensure `this` binding and basic
// validation behavior.  These do not spin up a Fastify server, avoiding the
// module duplication problems seen when testing routes directly.

describe("OrderController", () => {
  let controller: OrderController;
  let fakeReply: Partial<FastifyReply>;
  let replySent: any;

  beforeEach(() => {
    controller = new OrderController();
    replySent = undefined;
    fakeReply = {
      code(code: number) {
        (this as any).statusCode = code;
        return this as any;
      },
      status(code: number) {
        // alias for `code` used by response helpers
        return (this as any).code(code);
      },
      send(payload: any) {
        replySent = payload;
        return this as any;
      },
    } as unknown as FastifyReply;
  });

  it("maintains `this` when handler is passed unbound", async () => {
    const fakeRequest: Partial<FastifyRequest> = {
      body: mockOrderRazorpay as any,
      log: { error: vi.fn() } as any,
    };

    // stub the orderService on the controller instance
    (controller as any).orderService.createOrder = vi
      .fn()
      .mockResolvedValue({ id: 123 });

    const unbound = controller.createOrderHandler;
    await unbound(fakeRequest as any, fakeReply as any);

    expect((controller as any).orderService.createOrder).toHaveBeenCalled();
    expect(replySent).toBeDefined();
  });

  it("returns BAD_REQUEST when payment method is unsupported", async () => {
    const badReq: Partial<FastifyRequest> = {
      body: { ...mockOrderRazorpay, paymentMethod: "nope" } as any,
      log: { error: vi.fn() } as any,
    };

    await controller.createOrderHandler(badReq as any, fakeReply as any);

    expect(replySent).toBeDefined();
    expect((replySent as any).error).toBe("BAD_REQUEST");
  });
});
