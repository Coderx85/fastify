import { FastifyReply, FastifyRequest } from "fastify";
import { sendError, sendSuccess } from "@/lib/response";
import { razorpayService } from "@/modules/payment/razorpay.service";
import { config } from "@/lib/config";
import { z } from "zod";
import { createRazorpayCheckoutSchema } from "@/schema/payment.schema";

export const razorpayCheckOutHandler = {
  handler: async (
    req: FastifyRequest<{
      Body: z.infer<typeof createRazorpayCheckoutSchema>;
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const {
        orderId,
        customerEmail,
        customerName,
        successUrl,
        externalCustomerId,
      } = req.body;

      // create Razorpay order and attach user/order details in notes
      const { order, internalOrderId } = await razorpayService.createOrder(
        orderId,
        {
          customerEmail,
          customerName,
          externalCustomerId,
          successUrl,
        },
      );

      // Return order details and keyId for client-side checkout
      return sendSuccess(
        {
          order,
          keyId: config.RAZORPAY_KEY_ID,
          internalOrderId,
          successUrl: successUrl || config.SUCCESS_URL,
        },
        "Razorpay order created",
        reply,
        201,
      );
    } catch (error) {
      req.log.error(error);
      return sendError(
        "CREATE_ORDER_FAILED",
        error instanceof Error ? error.message : "Order creation failed",
        reply,
      );
    }
  },
};

type Req = {
  rawBody?: string;
};

export const razorpayWebhookHandler = {
  handler: async (req: FastifyRequest, reply: FastifyReply) => {
    const signature = (req.headers["x-razorpay-signature"] || "") as string;
    const rawBody = (req as Req).rawBody || JSON.stringify(req.body || {});

    if (!signature) {
      return sendError("MISSING_SIGNATURE", "Missing signature", reply, 400);
    }

    const verified = razorpayService.verifyWebhookSignature(rawBody, signature);
    if (!verified) {
      return sendError("INVALID_SIGNATURE", "Invalid signature", reply, 400);
    }

    type RazorpayWebhookPayload = {
      event: string;
      payload: {
        payment?: {
          entity: {
            order_id: string;
          };
        };
      };
    };

    // Handle relevant events (payment.captured, payment.failed, etc.)
    const payload = req.body as unknown as RazorpayWebhookPayload;
    try {
      const event = payload.event as string;
      if (event === "payment.captured") {
        const paymentEntity = payload.payload?.payment?.entity;
        if (paymentEntity?.order_id) {
          try {
            await razorpayService.markPaymentSucceeded(paymentEntity.order_id);
          } catch {
            sendError(
              "MARK_PAYMENT_FAILED",
              "Failed to mark payment succeeded",
              reply,
              500,
            );
          }
        }
      }

      return sendSuccess(
        { ok: true },
        "Webhook handled successfully",
        reply,
        200,
      );
    } catch {
      return sendError(
        "WEBHOOK_HANDLING_FAILED",
        "Failed to handle webhook",
        reply,
        500,
      );
    }
  },
};

export const razorpayVerifyHandler = {
  handler: async (
    req: FastifyRequest<{
      Body: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    const bodySchema = z.object({
      razorpay_order_id: z.string(),
      razorpay_payment_id: z.string(),
      razorpay_signature: z.string(),
    });

    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(
        "INVALID_PAYLOAD",
        "Invalid verification payload",
        reply,
        400,
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      parsed.data;

    const verified = razorpayService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    );

    if (!verified) {
      return sendError(
        "INVALID_SIGNATURE",
        "Signature verification failed",
        reply,
        400,
      );
    }

    try {
      await razorpayService.markPaymentSucceeded(razorpay_order_id);
      return sendSuccess({ ok: true }, "Payment verified", reply, 200);
    } catch (err) {
      req.log.error(err);
      return sendError(
        "MARK_PAYMENT_FAILED",
        "Failed to mark payment succeeded",
        reply,
        500,
      );
    }
  },
};

export const razorpayStatusHandler = {
  handler: async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const status = !!config.RAZORPAY_KEY_ID && !!config.RAZORPAY_KEY_SECRET;
      return sendSuccess({ status }, "Razorpay status retrieved", reply, 200);
    } catch (error) {
      req.log.error(error);
      return sendError(
        "RAZORPAY_STATUS_FAILED",
        error instanceof Error
          ? error.message
          : "Failed to retrieve Razorpay status",
        reply,
        500,
      );
    }
  },
};
