import { describe, it, beforeEach, assert, vi, afterEach } from "vitest";
import type { IProduct, IProductDTO } from "./product.definition";
import {
  createdProductSample,
  dbProductRow,
  dbProductRow2,
  priceRowsSample,
  productSample,
  rateMapSample,
  sampleDate,
} from "@test/samples/products-sample";
import { dbPool } from "@/db";

// ── Mock DB so no real Postgres connection is made ───────────────────────────
vi.mock("@/db", () => ({
  dbPool: {
    transaction: vi.fn(),
  },
  db: {
    transaction: vi.fn(),
    insert: vi.fn(),
    select: vi.fn(),
    delete: vi.fn(),
  },
}));

// ── Mock config to avoid missing env vars ────────────────────────────────────
vi.mock("@/lib/config", () => ({
  config: { EXCHANGE_API: "test-key" },
}));

/**
 * DTO used as createProduct input — currency is "usd" so the service
 * correctly treats USD as the base and derives INR via convertToIndianRupees.
 */
const sampleProductDTO: IProductDTO = {
  ...productSample,
  currency: "usd",
  createdAt: sampleDate,
};

/**
 * Returns a mock tx object for getProductById.
 * - First  tx.select() → .from() → .where() → .limit() → productRows[]
 * - Second tx.select() → .from() → .where()             → priceRows[]
 *   (service awaits .where() directly — no .execute() or .limit())
 */
function makeTxForGetById(
  productRows: object[],
  prices: { currencyType: string; priceAmount: number }[] = priceRowsSample,
) {
  const txSelect = vi
    .fn()
    // First call: fetch the product row
    .mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(productRows),
        }),
      }),
    })
    // Second call: fetch price records — must resolve to an array for `for...of`
    .mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(prices), // array ✓
      }),
    });
  return { select: txSelect };
}

/**
 * Handler for getting all products
 * GET /products
 */
function makeFetchSuccess() {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      result: "success",
      conversion_result: 1659, // used by convertToIndianRupees
      conversion_rate: 83.0, // used by convertToDollars
    }),
  });
}

/**
 * Returns a tx object whose insert().values().returning() resolves to [dbProductRow].
 * Uses the clean DB row (no amount/currency) so the service result shape matches IProduct.
 */
function makeTxWithProduct() {
  return {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([dbProductRow]),
      }),
    }),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("ProductService (real implementation, db mocked)", () => {
  let db: (typeof import("@/db"))["db"];
  let dbPool: (typeof import("@/db"))["dbPool"];

  beforeEach(async () => {
    vi.clearAllMocks();
    ({ db, dbPool } = await import("@/db"));
  });

  // ── createProduct ───────────────────────────────────────────────────────────
  describe("createProduct", () => {
    // Built from dbProductRow so the shape exactly matches what the service returns
    const expectedProduct: IProduct = {
      ...dbProductRow,
      rates: rateMapSample,
    };

    it("should create a product and return it with both currency rates (USD base)", async () => {
      makeFetchSuccess();
      vi.mocked(dbPool.transaction).mockImplementation(async (cb: any) =>
        cb(makeTxWithProduct()),
      );
      // addPriceToProduct calls db.insert directly (not via tx)
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      } as any);

      // Use dynamic import to get the real productService implementation
      const { productService } = await import("./product.service");
      const result = await productService.createProduct(sampleProductDTO);
      assert.deepEqual(result, expectedProduct);
    });

    it("Error - Product Already Exists", async () => {
      makeFetchSuccess();
      vi.mocked(dbPool.transaction).mockImplementation(async (cb: any) =>
        cb(makeTxWithProduct()),
      );

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      } as any);

      const { productService } = await import("./product.service");

      // Simulate a unique constraint violation error from the database
      const uniqueConstraintError = new Error("Unique constraint violation");
      (uniqueConstraintError as any).code = "23505";

      vi.mocked(dbPool.transaction).mockImplementationOnce(async (cb: any) =>
        cb({
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([productSample]),
            }),
          }),
          // Simulate the error when addPriceToProduct tries to insert price records
          insertPrice: vi.fn().mockRejectedValue(uniqueConstraintError),
        }),
      );

      try {
        await productService.createProduct(sampleProductDTO);
      } catch (error) {
        assert.equal(
          (error as Error).message,
          "Product with the same name already exists.",
        );
        assert.equal((error as any).cause.code, "CONFLICT");
      }
    });

    it("Error - PRODUCT_CREATE_FAILED", async () => {
      makeFetchSuccess();
      vi.mocked(dbPool.transaction).mockImplementation(async (cb: any) =>
        cb({
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([productSample]),
            }),
          }),
          insertPrice: vi.fn().mockRejectedValue(new Error("DB_INSERT_FAILED")),
        }),
      );

      const { productService } = await import("./product.service");

      try {
        await productService.createProduct(sampleProductDTO);
      } catch (error) {
        assert.equal((error as Error).message, "Failed to create product");
        assert.equal((error as any).cause?.code, "PRODUCT_CREATE_FAILED");
      }
    });
  });

  // ── getProductById ─────────────────────────────────────────────────────────
  describe("getProductById", () => {
    it("should return a product with its rates when found", async () => {
      const tx = makeTxForGetById([dbProductRow], priceRowsSample);
      vi.mocked(dbPool.transaction).mockImplementation(async (cb: any) =>
        cb(tx),
      );

      const { productService } = await import("./product.service");
      const result = await productService.getProductById(1);

      assert.ok(result, "Should return a product");
      assert.deepEqual(result, createdProductSample);
    });

    it("should return null when product is not found", async () => {
      const tx = makeTxForGetById([]);
      vi.mocked(dbPool.transaction).mockImplementation(async (cb: any) =>
        cb(tx),
      );

      const { productService } = await import("./product.service");

      try {
        await productService.getProductById(999);
        assert.fail("Expected error to be thrown");
      } catch (error) {
        assert.ok(error instanceof Error);
        assert.match(error.message, /Failed to fetch product by ID/);
        assert.match(
          (error as any).cause?.message ?? "",
          /Product with ID 999 not found/,
        );
      }
    });

    it("should throw when DB query fails", async () => {
      vi.mocked(dbPool.transaction).mockRejectedValue(
        new Error("DB connection lost"),
      );

      const { productService } = await import("./product.service");

      try {
        await productService.getProductById(1);
        assert.fail("Expected error to be thrown");
      } catch (error) {
        assert.ok(error instanceof Error);
        assert.match(error.message, /Failed to fetch product by ID/);
      }
    });
  });

  // ── getProducts ─────────────────────────────────────────────────────────
  describe("getProducts", () => {
    // Clean IProduct shapes — no amount/currency
    const sampleProduct1: IProduct = { ...dbProductRow, rates: rateMapSample };
    const sampleProduct2: IProduct = { ...dbProductRow2, rates: rateMapSample };
    const expectedResult: IProduct[] = [sampleProduct1, sampleProduct2];

    it("should return an array of products with their rates", async () => {
      // getProducts calls db.select() directly twice per product:
      //   1st: db.select().from(productsTable).execute() → product rows
      //   2nd: db.select().from(priceTable).where(...) → price rows (per product)
      vi.mocked(db.select)
        .mockReturnValueOnce({
          // 1st call: fetch all product rows
          from: vi.fn().mockReturnValue({
            execute: vi.fn().mockResolvedValue([dbProductRow, dbProductRow2]),
          }),
        } as any)
        .mockReturnValueOnce({
          // 2nd call: price rows for product 1
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(priceRowsSample),
          }),
        } as any)
        .mockReturnValueOnce({
          // 3rd call: price rows for product 2
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(priceRowsSample),
          }),
        } as any);

      const { productService } = await import("./product.service");
      const result = await productService.getProducts();

      assert.ok(Array.isArray(result), "Should return an array");
      assert.equal(result!.length, 2);
      assert.deepEqual(result, expectedResult);
    });

    it("should return an empty array when no products are found", async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          execute: vi.fn().mockResolvedValue([]), // no products
        }),
      } as any);

      const { productService } = await import("./product.service");
      const result = await productService.getProducts();

      assert.ok(Array.isArray(result), "Should return an array");
      assert.equal(result!.length, 0, "Should return an empty array");
    });
  });

  // ── deleteProduct ─────────────────────────────────────────────────────────
  describe("deleteProduct", () => {
    it("should delete a product and its prices successfully", async () => {
      // Mock db.select() for findProductById check
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([dbProductRow]),
          }),
        }),
      } as any);

      // Mock db.delete() for the delete operations
      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      } as any);

      const { productService } = await import("./product.service");
      const result = await productService.deleteProduct(1);

      // Verify deletion was successful
      assert.deepEqual(result, { deleted: true });

      // Verify db.delete was called
      assert.equal(
        vi.mocked(db.delete).mock.calls.length,
        2,
        "Should call delete twice (product and prices)",
      );

      // Verify db.select was called for findProductById check
      assert.equal(
        vi.mocked(db.select).mock.calls.length,
        1,
        "Should check if product exists",
      );
    });
  });
  afterEach(() => {
    vi.resetAllMocks();
  });
});
