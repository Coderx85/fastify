import { FastifyReply, FastifyRequest } from "fastify";
import { sendError, sendSuccess } from "@/lib/response";
import { GetProductsQuery } from "@/schema/product.schema";
import { ProductService } from "@/modules/product.service";

// Initialize service
const productService = new ProductService();

export const getProductsHandler = {
  handler: async (
    request: FastifyRequest<{ Querystring: GetProductsQuery }>,
    reply: FastifyReply,
  ) => {
    try {
      const { category } = request.query;

      // Get products - either all or filtered by category
      const products = category
        ? await productService.getProductByQuery(category)
        : await productService.getAllProducts();

      // Validate products
      if (!products || products.length === 0) {
        return sendError(
          category
            ? `No products found for category: ${category}`
            : "No products found",
          "NOT_FOUND",
          reply,
          404,
        );
      }

      // Prepare response
      const result = {
        products,
      };

      // Send success response
      sendSuccess(
        result,
        category
          ? `Products in '${category}' fetched successfully`
          : "All products fetched successfully",
        reply,
        200,
      );
    } catch (error) {
      request.log.error(error);
      return sendError(
        "Failed to fetch products",
        "INTERNAL_SERVER_ERROR",
        reply,
        500,
      );
    }
  },
};
