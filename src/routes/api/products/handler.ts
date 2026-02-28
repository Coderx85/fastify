import { FastifyReply, FastifyRequest } from "fastify";
import { sendError, sendSuccess } from "@/lib/response";
import { CreateProductInput } from "@/schema/product.schema";
import { productService } from "@/modules/products/product.service";
import { IProduct } from "@/modules/products/product.definition";

/**
 * Handler for getting all products (with optional category filter)
 * GET /products
 */
export const getProductsHandler = {
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // const { category } = request.query;

      // Get products - either all or filtered by category
      const products = productService.getProducts();

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
      return sendError(
        "Failed to fetch products",
        "INTERNAL_SERVER_ERROR",
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

      if (error instanceof Error) {
        const cause = (error as any).cause as { code?: string } | undefined;

        if (cause?.code === "CONFLICT") {
          return sendError(cause.code, error.message, reply, 409);
        }
      }

      return sendError(
        "An unexpected error occurred while creating the product.",
        "INTERNAL_SERVER_ERROR",
        reply,
        500,
      );
    }
  },
};
