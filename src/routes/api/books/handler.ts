import type { FastifyReply, FastifyRequest } from "fastify";
import { sendError, sendSuccess } from "@/lib/response";
import type {
  GetBookByIdParams,
  CreateBookBody,
  UpdateBookBody,
  DeleteBookParams,
} from "@/schema/book.schema";
import { productService } from "@/modules/product.service";
import { product, TProduct } from "@/db/schema";

/**
 * GET /books
 * @returns all products in "Books" category
 */
export const getBooksHandler = {
  handler: async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const books = await productService.getProductByQuery("Books");

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
 *
 * @returns single product in "Books" category by ID
 */
export const getBookByIdHandler = {
  handler: async (
    request: FastifyRequest<{ Params: GetBookByIdParams }>,
    reply: FastifyReply,
  ) => {
    try {
      const { bookId } = request.params;
      const product = await productService.getProductById(bookId);

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
      const product = request.body;

      const payload = {
        ...product,
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
        product as unknown as Partial<TProduct>,
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
