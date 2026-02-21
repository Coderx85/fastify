import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import {
  getBookByIdSchema,
  createBookSchema,
  updateBookSchema,
  deleteBookSchema,
} from "@/schema/book.schema";
import {
  getBooksHandler,
  getBookByIdHandler,
  createBookHandler,
  updateBookHandler,
  deleteBookHandler,
} from "./handler";

export default async function booksRoute(fastify: FastifyInstance) {
  // Get all books
  fastify.withTypeProvider<ZodTypeProvider>().get("/", {
    handler: getBooksHandler.handler,
  });

  // Create a new book
  fastify.withTypeProvider<ZodTypeProvider>().post("/", {
    schema: createBookSchema,
    handler: createBookHandler.handler,
  });

  // Get book by ID
  fastify.withTypeProvider<ZodTypeProvider>().get("/:bookId", {
    schema: getBookByIdSchema,
    handler: getBookByIdHandler.handler,
  });

  // Update a book
  fastify.withTypeProvider<ZodTypeProvider>().put("/:bookId", {
    schema: updateBookSchema,
    handler: updateBookHandler.handler,
  });

  // Delete a book
  fastify.withTypeProvider<ZodTypeProvider>().delete("/:bookId", {
    schema: deleteBookSchema,
    handler: deleteBookHandler.handler,
  });
}
