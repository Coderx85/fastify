import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { eq } from "drizzle-orm";

const SuccessQuery = z.object({ orderId: z.string().or(z.number()) });

export default async function checkoutRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/success",
    {
      schema: {
        querystring: SuccessQuery,
        description: "Simple confirmation page for a completed checkout",
        tags: ["Checkout"],
      },
    },
    async (
      request: FastifyRequest<{ Querystring: z.infer<typeof SuccessQuery> }>,
      reply: FastifyReply,
    ) => {
      const parsed = SuccessQuery.safeParse(request.query);
      if (!parsed.success) {
        return reply
          .status(400)
          .type("text/html")
          .send(`<h1>Missing orderId</h1>`);
      }

      const orderId = Number(parsed.data.orderId);

      try {
        const [payment] = await db
          .select()
          .from(payments)
          .where(eq(payments.orderId, orderId))
          .orderBy(payments.createdAt)
          .limit(1);

        if (!payment) {
          return reply.type("text/html").send(`
            <h1>Payment not found</h1>
            <p>No payment record found for orderId=${orderId}</p>
          `);
        }

        return reply.type("text/html").send(`
          <h1>Payment Confirmation</h1>
          <p>Order ID: ${orderId}</p>
          <p>Payment ID: ${payment.id}</p>
          <p>Status: ${payment.status}</p>
          <p>Amount: ${payment.amount}</p>
        `);
      } catch (err) {
        request.log.error(err);
        return reply
          .status(500)
          .type("text/html")
          .send(`<h1>Error</h1><p>Failed to load confirmation</p>`);
      }
    },
  );
}
