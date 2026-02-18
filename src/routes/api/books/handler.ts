import { FastifyReply, FastifyRequest } from "fastify";
import { sendError, sendSuccess } from "@/lib/response";
import {
  GetBookByIdParams,
  CreateBookBody,
  UpdateBookBody,
  DeleteBookParams,
} from "@/schema/book.schema";
import { ProductService } from "@/modules/product.service";

const productService = new ProductService();

/**
 * GET /books
 */
export const getBooksHandler = {
  handler: async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const books = await productService.getProductByQuery("Books");

      if (!books || books.length === 0) {
        return sendError("No books found", "NOT_FOUND", reply, 404);
      }

      return sendSuccess(
        { products: books },
        "Books fetched successfully",
        reply,
        200,
      );
    } catch (error) {
      reply.log.error(error);
      return sendError(
        "Failed to fetch books",
        "INTERNAL_SERVER_ERROR",
        reply,
        500,
      );
    }
  },
};

/**
 * GET /books/:bookId
 */
export const getBookByIdHandler = {
  handler: async (
    request: FastifyRequest<{ Params: GetBookByIdParams }>,
    reply: FastifyReply,
  ) => {
    try {
      const { bookId } = request.params;
      const product = await productService.getProductById(bookId);

      if (!product || product.category !== "Books") {
        return sendError(
          `Book with ID ${bookId} not found`,
          "NOT_FOUND",
          reply,
          404,
        );
      }

      return sendSuccess(product, "Book fetched successfully", reply, 200);
    } catch (error) {
      request.log.error(error);
      return sendError(
        "Failed to fetch book",
        "INTERNAL_SERVER_ERROR",
        reply,
        500,
      );
    }
  },
};

/**
 * POST /books
 */
export const createBookHandler = {
  handler: async (
    request: FastifyRequest<{ Body: CreateBookBody }>,
    reply: FastifyReply,
  ) => {
    try {
      const payload = {
        ...request.body,
        category: "Books",
      } as CreateBookBody & { category: "Books" };
      const result = await productService.createProduct(payload);

      return sendSuccess(
        { product: result },
        "Book created successfully",
        reply,
        201,
      );
    } catch (error) {
      request.log.error(error);
      return sendError(
        "Failed to create book",
        "INTERNAL_SERVER_ERROR",
        reply,
        500,
      );
    }
  },
};

/**
 * PUT /books/:bookId
 */
export const updateBookHandler = {
  handler: async (
    request: FastifyRequest<{
      Params: GetBookByIdParams;
      Body: UpdateBookBody;
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const { bookId } = request.params;

      const existing = await productService.getProductById(bookId);
      if (!existing || existing.category !== "Books") {
        return sendError(
          `Book with ID ${bookId} not found`,
          "NOT_FOUND",
          reply,
          404,
        );
      }

      const result = await productService.updateProduct(
        bookId,
        request.body as any,
      );

      if (!result) {
        return sendError(
          `Book with ID ${bookId} not found`,
          "NOT_FOUND",
          reply,
          404,
        );
      }

      return sendSuccess(
        { product: result },
        "Book updated successfully",
        reply,
        200,
      );
    } catch (error) {
      request.log.error(error);
      return sendError(
        "Failed to update book",
        "INTERNAL_SERVER_ERROR",
        reply,
        500,
      );
    }
  },
};

/**
 * DELETE /books/:bookId
 */
export const deleteBookHandler = {
  handler: async (
    request: FastifyRequest<{ Params: DeleteBookParams }>,
    reply: FastifyReply,
  ) => {
    try {
      const { bookId } = request.params;

      const existing = await productService.getProductById(bookId);
      if (!existing || existing.category !== "Books") {
        return sendError(
          `Book with ID ${bookId} not found`,
          "NOT_FOUND",
          reply,
          404,
        );
      }

      const result = await productService.deleteProduct(bookId);

      if (!result.deleted) {
        return sendError(
          `Book with ID ${bookId} not found`,
          "NOT_FOUND",
          reply,
          404,
        );
      }

      return sendSuccess(result, "Book deleted successfully", reply, 200);
    } catch (error) {
      request.log.error(error);
      return sendError(
        "Failed to delete book",
        "INTERNAL_SERVER_ERROR",
        reply,
        500,
      );
    }
  },
};
