import {
  currencyType,
  IProduct,
  IProductDTO,
} from "@/modules/products/product.definition";

/** Fixed timestamp used across all samples for deterministic date comparisons */
export const sampleDate = new Date();

export const productSample: IProductDTO = {
  id: 1,
  name: "Sample Product",
  description: "This is a sample product",
  category: "Books",
  amount: 19.99,
  currency: "inr",
  createdAt: sampleDate,
};

export const productSample2: IProductDTO = {
  id: 2,
  name: "Another Product",
  description: "This is another sample product",
  category: "Electronics",
  amount: 99.99,
  currency: "usd",
  createdAt: sampleDate,
};

export const rateMapSample: Record<currencyType, number> = {
  inr: 1659,
  usd: 19.99,
};

/**
 * Raw DB row — exactly what Drizzle returns from productsTable.
 * No derived fields (amount, currency) — only table columns.
 */
export const dbProductRow = {
  id: 1,
  name: productSample.name,
  description: productSample.description,
  category: productSample.category,
  createdAt: sampleDate,
  updatedAt: sampleDate,
};

/**
 * Price rows — exactly what Drizzle returns from productsPriceTables.
 * Must be an array of { currencyType, priceAmount } for `for...of` in the service.
 */
export const priceRowsSample = [
  { currencyType: "usd" as const, priceAmount: 19.99 },
  { currencyType: "inr" as const, priceAmount: 1659 },
];

/**
 * Raw DB row for product 2 — mirrors productSample2 table columns only.
 */
export const dbProductRow2 = {
  id: 2,
  name: productSample2.name,
  description: productSample2.description,
  category: productSample2.category,
  createdAt: sampleDate,
  updatedAt: sampleDate,
};

/**
 * Expected IProduct after the service attaches rates to dbProductRow.
 * Does NOT include amount/currency (those are DTO-only fields).
 */
export const createdProductSample: IProduct = {
  ...dbProductRow,
  rates: rateMapSample,
};
