import { FastifyReply, FastifyRequest } from "fastify";
import { sendError, sendSuccess } from "@/lib/response";
import { CreateProductInput } from "@/schema/product.schema";
import { productService } from "@/modules/products/product.service";
import { IProduct } from "@/modules/products/product.definition";
import { getCauseCode } from "@/lib/error";

/**
 * Handler for getting all products (with optional category filter)
 * GET /products
 */
export const getProductsHandler = {
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // const { category } = request.query;

      // Get products - either all or filtered by category
      const products = await productService.getProducts();

      // // Validate products
      // if (!products || products.length === 0) {
      //   return sendError(
      //     category
      //       ? `No products found for category: ${category}`
      //       : "No products found",
      //     "NOT_FOUND",
      //     reply,
      //     404,
      //   );
      // }

      // Send success response
      sendSuccess(
        { products },
        "All products fetched successfully",
        reply,
        200,
      );
    } catch (error) {
      request.log.error(error);

      const code = getCauseCode(error);
      if (code === "NOT_FOUND") {
        return sendError("NOT_FOUND", "No products found", reply, 404);
      }

      return sendError(
        "INTERNAL_SERVER_ERROR",
        "Failed to fetch products",
        reply,
        500,
      );
    }
  },
};

/**
 * Handler for getting a single product by ID
 * GET /products/:productId
 */
export const getProductByIdHandler = {
  handler: async (
    request: FastifyRequest<{ Params: { productId: number } }>,
    reply: FastifyReply,
  ) => {
    try {
      const { productId } = request.params;

      const product = await productService.getProductById(productId);

      if (!product) {
        return sendError(
          "NOT_FOUND",
          `Product with ID ${productId} not found`,
          reply,
          404,
        );
      }

      sendSuccess({ product }, "Product fetched successfully", reply, 200);
    } catch (error) {
      request.log.error(error);

      const code = getCauseCode(error);
      if (code === "NOT_FOUND") {
        return sendError(
          "NOT_FOUND",
          `Product with ID ${request.params.productId} not found`,
          reply,
          404,
        );
      }

      return sendError(
        "INTERNAL_SERVER_ERROR",
        "Failed to fetch product",
        reply,
        500,
      );
    }
  },
};

/**
 * Handler for creating a new product
 *@method POST /products
 */
export const createProductHandler = {
  handler: async (
    request: FastifyRequest<{ Body: CreateProductInput }>,
    reply: FastifyReply,
  ) => {
    try {
      const { name, description, category, amount, currency } = request.body;

      let result: IProduct = {} as IProduct;

      result = await productService.createProduct({
        name,
        description,
        category,
        amount,
        currency,
        createdAt: new Date(),
      });
      return sendSuccess(result, "Product created successfully", reply, 201);
    } catch (error) {
      request.log.error(error);

      const code = getCauseCode(error);
      if (code === "CONFLICT" && error instanceof Error) {
        return sendError("CONFLICT", error.message, reply, 409);
      }

      return sendError(
        "INTERNAL_SERVER_ERROR",
        "An unexpected error occurred while creating the product.",
        reply,
        500,
      );
    }
  },
};

/**
 * Handler for deleting a product by ID
 * @method DELETE /products/:productId
 */
export const deleteProductHandler = {
  handler: async (
    request: FastifyRequest<{ Params: { productId: number } }>,
    reply: FastifyReply,
  ) => {
    try {
      const { productId } = request.params;

      const result = await productService.deleteProduct(productId);

      sendSuccess(result, "Product deleted successfully", reply, 200);
    } catch (error) {
      request.log.error(error);

      const code = getCauseCode(error);
      if (code === "NOT_FOUND") {
        return sendError(
          "NOT_FOUND",
          `Product with ID ${request.params.productId} not found`,
          reply,
          404,
        );
      }

      return sendError(
        "INTERNAL_SERVER_ERROR",
        "Failed to delete product",
        reply,
        500,
      );
    }
  },
};
