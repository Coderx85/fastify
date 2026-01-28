// import { eq } from "drizzle-orm";
// import { db } from "@/db";
// import { product } from "@/db/schema";
import { FastifyReply, FastifyRequest } from "fastify";
import { sendError, sendSuccess } from "@/lib/response";
import { GetProductByIdParams } from "@/schema/product.schema";
import { ProductService } from "@/modules/product.service";

// Initialize service
const productService = new ProductService();

export const getProductByIdHandler = {
  handler: async (
    request: FastifyRequest<{ Params: GetProductByIdParams }>,
    reply: FastifyReply,
  ) => {
    try {
      const { productId } = request.params;

      // Fetch product by productId (primary key)
      const foundProduct = await productService.getProductById(productId);

      if (!foundProduct) {
        return sendError(
          `Product with ID ${productId} not found`,
          "NOT_FOUND",
          reply,
          404,
        );
      }

      sendSuccess(
        { product: foundProduct },
        "Product fetched successfully",
        reply,
        200,
      );
    } catch (error) {
      request.log.error(error);
      return sendError(
        "Failed to fetch product",
        "INTERNAL_SERVER_ERROR",
        reply,
        500,
      );
    }
  },
};
