import { FastifyReply, FastifyRequest } from "fastify";
import { CreateProductInput } from "@/schema/product.schema";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendSuccess, sendError } from "@/lib";

export async function createProductHandler(
  request: FastifyRequest<{
    Body: CreateProductInput;
  }>,
  reply: FastifyReply,
) {
  const product = await db.insert(products).values(request.body).returning();

  if (!product) {
    return sendError(
      "Failed to create product",
      "PRODUCT_NOT_CREATED",
      reply,
      500,
    );
  }

  return sendSuccess(product[0], "PRODUCT_CREATED_SUCCESSFULLY", reply, 201);
}

export async function getProductsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const productsList = await db.query.products.findMany();
  return sendSuccess(productsList, "PRODUCTS_FETCHED_SUCCESSFULLY", reply, 200);
}

export async function getProductByIdHandler(
  request: FastifyRequest<{
    Params: { id: number };
  }>,
  reply: FastifyReply,
) {
  try {
    const { id } = request.params;
    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!product) {
      return sendError(
        "Failed to find product",
        "PRODUCT_NOT_FOUND",
        reply,
        404,
      );
    }

    return sendSuccess(product, "PRODUCT_FETCHED_SUCCESSFULLY", reply, 200);
  } catch (error: unknown) {
    return sendError(String(error), "FAILED_TO_FETCH_PRODUCT", reply, 404);
  }
}
