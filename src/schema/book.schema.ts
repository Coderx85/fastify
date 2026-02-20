import { z } from "zod";
import {
  productSchema,
  productResponseSchema,
  productsDataSchema,
  createProductBodySchema,
  updateProductBodySchema,
} from "@/schema/product.schema";
import { successResponseSchema } from "@/types/api";
import { categoryEnumValues } from "@/db/schema";

const currencyEnum = z.enum(["inr", "usd"]);

// Reuse product schema (books are products with category = "Books")
export const bookSchema = productResponseSchema.extend({
  currency: currencyEnum,
});
export const booksDataSchema = productsDataSchema.extend({
  currency: currencyEnum,
});

// ============ GET /books ============
export const getBooksSchema = {
  response: {
    200: successResponseSchema(booksDataSchema),
  },
};

// ============ GET /books/:bookId ============
export const getBookByIdSchema = {
  params: z.object({
    bookId: z.coerce.number().int().positive(),
  }),
  response: {
    200: successResponseSchema(bookSchema),
  },
};

// ============ POST /books ============
// Reuse product create body fields (server will set `category` to "Books")
export const createBookBodySchema = createProductBodySchema.pick({
  name: true,
  description: true,
  price: true,
});

export const createBookSchema = {
  body: createBookBodySchema,
  response: {
    201: successResponseSchema(z.object({ product: bookSchema })),
  },
};

// ============ PUT /books/:bookId ============
// Define update schema explicitly (cannot use .omit() on schemas with refinements)
export const updateBookBodySchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    price: z.number().int().positive().optional(),
    // note: category intentionally omitted
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the book",
  });

export const updateBookSchema = {
  params: z.object({
    bookId: z.coerce.number().int().positive(),
  }),
  body: updateBookBodySchema,
  response: {
    200: successResponseSchema(z.object({ product: bookSchema })),
  },
};

// ============ DELETE /books/:bookId ============
export const deleteBookSchema = {
  params: z.object({
    bookId: z.coerce.number().int().positive(),
  }),
  response: {
    200: successResponseSchema(
      z.object({ deleted: z.boolean(), productId: z.number() }),
    ),
  },
};

// ============ Type exports ============
export type Book = z.infer<typeof bookSchema>;
export type GetBooksData = z.infer<typeof booksDataSchema>;
export type GetBookByIdParams = z.infer<typeof getBookByIdSchema.params>;
export type CreateBookBody = z.infer<typeof createBookBodySchema>;
export type UpdateBookBody = z.infer<typeof updateBookBodySchema>;
export type DeleteBookParams = z.infer<typeof deleteBookSchema.params>;
