import { FastifyReply, FastifyRequest } from "fastify";
import { sendError, sendSuccess } from "@/lib/response";
import {
  GetProductsQuery,
  GetProductByIdParams,
  CreateProductBody,
  UpdateProductParams,
  UpdateProductBody,
  DeleteProductParams,
} from "@/schema/product.schema";
import { ProductService } from "@/modules/product.service";

// Initialize service
const productService = new ProductService();

/**
 * Handler for getting all products (with optional category filter)
 * GET /products
 */
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

      // Send success response
      sendSuccess(
        { products },
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

/**
 * Handler for getting a single product by ID
 * GET /products/:productId
 */
export const getProductByIdHandler = {
  handler: async (
    request: FastifyRequest<{ Params: GetProductByIdParams }>,
    reply: FastifyReply,
  ) => {
    try {
      const { productId } = request.params;

      const product = await productService.getProductById(productId);

      if (!product) {
        return sendError(
          `Product with ID ${productId} not found`,
          "NOT_FOUND",
          reply,
          404,
        );
      }

      sendSuccess({ product }, "Product fetched successfully", reply, 200);
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

/**
 * Handler for creating a new product
 * POST /products
 */
export const createProductHandler = {
  handler: async (
    request: FastifyRequest<{ Body: CreateProductBody }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await productService.createProduct(request.body);

      sendSuccess(
        { product: result },
        "Product created successfully",
        reply,
        201,
      );
    } catch (error) {
      request.log.error(error);
      return sendError(
        "Failed to create product",
        "INTERNAL_SERVER_ERROR",
        reply,
        500,
      );
    }
  },
};

/**
 * Handler for updating a product
 * PUT /products/:productId
 */
export const updateProductHandler = {
  handler: async (
    request: FastifyRequest<{
      Params: UpdateProductParams;
      Body: UpdateProductBody;
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const { productId } = request.params;
      const result = await productService.updateProduct(
        productId,
        request.body,
      );

      if (!result) {
        return sendError(
          `Product with ID ${productId} not found`,
          "NOT_FOUND",
          reply,
          404,
        );
      }

      sendSuccess(
        { product: result },
        "Product updated successfully",
        reply,
        200,
      );
    } catch (error) {
      request.log.error(error);
      return sendError(
        "Failed to update product",
        "INTERNAL_SERVER_ERROR",
        reply,
        500,
      );
    }
  },
};

/**
 * Handler for deleting a product
 * DELETE /products/:productId
 */
export const deleteProductHandler = {
  handler: async (
    request: FastifyRequest<{ Params: DeleteProductParams }>,
    reply: FastifyReply,
  ) => {
    try {
      const { productId } = request.params;
      const result = await productService.deleteProduct(productId);

      if (!result.deleted) {
        return sendError(
          `Product with ID ${productId} not found`,
          "NOT_FOUND",
          reply,
          404,
        );
      }

      sendSuccess(result, "Product deleted successfully", reply, 200);
    } catch (error) {
      request.log.error(error);
      return sendError(
        "Failed to delete product",
        "INTERNAL_SERVER_ERROR",
        reply,
        500,
      );
    }
  },
};
