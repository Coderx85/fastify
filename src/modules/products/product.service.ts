import { db } from "@/db";
import { productsTable as product, productsPriceTables } from "@/db/schema";
import { config } from "@/lib/config";
// import { CreateProductBody, UpdateProductBody } from "@/schema/product.schema";
import {} from "@/schema/product.schema";
import {
  currencyType,
  IProduct,
  IProductDTO,
  IProductInput,
  IProductService,
  RateMap,
} from "@/modules/products/product.definition";
import { eq, and } from "drizzle-orm";

class ProductService implements IProductService {
  private async convertToIndianRupees(basePrice: number): Promise<number> {
    const inr = "INR" as const;
    const usd = "USD" as const;
    let data: any;
    try {
      const res = await fetch(
        `https://v6.exchangerate-api.com/v6/${config.EXCHANGE_API}/pair/${inr}/${usd}/${basePrice}`,
      );
      data = await res.json();
      if (!res.ok || !data || data.result !== "success") {
        throw new Error(
          `Exchange API returned failure: ${data?.error_type ?? res.status}`,
        );
      }
    } catch (err) {
      throw new Error("Failed to fetch INR→USD exchange rate", {
        cause: { code: "EXCHANGE_RATE_FAILED", original: err },
      });
    }

    if (
      !data.conversion_result ||
      typeof data.conversion_result !== "number" ||
      data.conversion_result <= 0
    ) {
      throw new Error("Invalid conversion result from exchange API", {
        cause: { code: "EXCHANGE_RATE_FAILED" },
      });
    }

    return data.conversion_result;
  }

  private async convertToDollars(basePrice: number): Promise<number> {
    const inr = "INR" as const;
    const usd = "USD" as const;
    let data: any;
    try {
      const res = await fetch(
        `https://v6.exchangerate-api.com/v6/${config.EXCHANGE_API}/pair/${usd}/${inr}/${basePrice}`,
      );
      data = await res.json();
      if (!res.ok || !data || data.result !== "success") {
        throw new Error(
          `Exchange API returned failure: ${data?.error_type ?? res.status}`,
        );
      }
    } catch (err) {
      throw new Error("Failed to fetch USD→INR exchange rate", {
        cause: { code: "EXCHANGE_RATE_FAILED", original: err },
      });
    }

    return basePrice * (data.conversion_rate || 0.0125);
  }

  private async addPriceToProduct({
    productId,
    priceAmount,
    currencyType,
  }: {
    productId: number;
    priceAmount: number;
    currencyType: currencyType;
  }): Promise<RateMap> {
    let rates: RateMap = {
      inr: 0,
      usd: 0,
    };

    const priceRecord = {
      productId,
      priceAmount,
      currencyType,
    };

    await db.insert(productsPriceTables).values(priceRecord);
    rates[currencyType] = priceAmount;
    // Add related price for the other currency as well
    if (currencyType === "usd") {
      const inrAmount = await this.convertToIndianRupees(priceAmount);
      await db.insert(productsPriceTables).values({
        productId,
        priceAmount: inrAmount,
        currencyType: "inr",
      });
      rates.inr = inrAmount;
    } else {
      const usdAmount = await this.convertToDollars(priceAmount);
      await db.insert(productsPriceTables).values({
        productId,
        priceAmount: usdAmount,
        currencyType: "usd",
      });
      rates.usd = usdAmount;
    }

    return rates;
  }

  private async findProductById(id: number) {
    const [productRecord] = await db
      .select()
      .from(product)
      .where(eq(product.id, id))
      .limit(1);

    if (!productRecord) {
      return null;
    }
    return productRecord;
  }

  async createProduct(data: IProductDTO) {
    try {
      return await db.transaction(async (tx) => {
        // Insert the base product
        const [createdProduct] = await tx
          .insert(product)
          .values({
            name: data.name,
            description: data.description,
            category: data.category,
          })
          .returning();

        // Insert currency prices — runs inside the same transaction so any
        const rates = await this.addPriceToProduct({
          productId: createdProduct.id,
          priceAmount: data.amount,
          currencyType: data.currency,
        });

        const result: IProduct = {
          ...createdProduct,
          rates: {
            inr: rates.inr,
            usd: rates.usd,
          },
        };

        return result;
      });
    } catch (error) {
      switch (error instanceof Error) {
        // PostgreSQL unique-constraint violation
        case (error as any).code === "23505":
          throw new Error(
            `A product with the name "${data.name}" already exists.`,
            { cause: { code: "CONFLICT" } },
          );

        default:
          throw new Error("Failed to create product", {
            cause: { code: "PRODUCT_CREATE_FAILED", original: error },
          });
      }
    }
  }

  async getProducts(): Promise<IProduct[] | null> {
    let baseProducts: IProduct[] = [];
    try {
      const products = await db.select().from(product).execute();

      if (products.length === 0) return baseProducts;

      for (const productRecord of products) {
        const priceRecords = await db
          .select()
          .from(productsPriceTables)
          .where(eq(productsPriceTables.productId, productRecord.id));

        const rates: RateMap = {
          inr: 0,
          usd: 0,
        };

        for (const price of priceRecords) {
          rates[price.currencyType] = price.priceAmount;
        }

        baseProducts.push({
          ...productRecord,
          rates,
        });
      }
      return baseProducts;
    } catch (error) {
      throw new Error("Failed to fetch products", {
        cause: error,
      });
    }
    return baseProducts;
  }

  async getProductById(id: number): Promise<IProduct | null> {
    let baseProduct: IProduct | null = null;
    try {
      await db.transaction(async (tx) => {
        const [productRecord] = await tx
          .select()
          .from(product)
          .where(eq(product.id, id))
          .limit(1);

        if (!productRecord) {
          throw new Error(`Product with ID ${id} not found`, {
            cause: { code: "NOT_FOUND" },
          });
        }

        const priceRecords = await tx
          .select()
          .from(productsPriceTables)
          .where(eq(productsPriceTables.productId, id));

        const rates: RateMap = {
          inr: 0,
          usd: 0,
        };

        for (const price of priceRecords) {
          rates[price.currencyType] = price.priceAmount;
        }

        baseProduct = {
          ...productRecord,
          rates,
        };
      });

      return baseProduct;
    } catch (error) {
      throw new Error("Failed to fetch product by ID", {
        cause: error,
      });
    }
  }

  async updateProduct(
    id: number,
    input: Partial<IProductInput>,
  ): Promise<IProduct | null> {
    try {
      const existingProduct = await this.findProductById(id);

      if (!existingProduct) {
        throw new Error(`Product with ID ${id} not found`, {
          cause: { code: "NOT_FOUND" },
        });
      }

      const updateData: Partial<IProduct> = {
        name: input.name,
        description: input.description,
        category: input.category,
      };

      const [updatedProduct] = await db
        .update(product)
        .set(updateData)
        .where(eq(product.id, id))
        .returning();

      if (!updatedProduct) {
        throw new Error("Database did not return the updated product", {
          cause: { code: "DB_UPDATE_FAILED" },
        });
      }

      // If price or currency is being updated, update the prices table as well
      if (input.amount !== undefined && input.currency !== undefined) {
        await db
          .update(productsPriceTables)
          .set({ priceAmount: input.amount })
          .where(
            and(
              eq(productsPriceTables.productId, id),
              eq(productsPriceTables.currencyType, input.currency),
            ),
          );
      }

      // Fetch the latest price records to return the updated product with current rates
      const priceRecords = await db
        .select()
        .from(productsPriceTables)
        .where(eq(productsPriceTables.productId, id));

      const rates: RateMap = {
        inr: 0,
        usd: 0,
      };

      for (const price of priceRecords) {
        rates[price.currencyType] = price.priceAmount;
      }

      return {
        ...updatedProduct,
        rates,
      };
    } catch (error) {
      throw new Error("Failed to update product", {
        cause: error,
      });
    }
  }

  async deleteProduct(id: number): Promise<{ success: boolean }> {
    const checkExisting = await this.findProductById(id);

    if (!checkExisting) {
      throw new Error(`Product with ID ${id} not found`, {
        cause: { code: "NOT_FOUND" },
      });
    }
    try {
      await db.delete(product).where(eq(product.id, id));
      await db
        .delete(productsPriceTables)
        .where(eq(productsPriceTables.productId, id));

      return { success: true };
    } catch (error) {
      throw new Error("Failed to delete product", {
        cause: error,
      });
    }
  }
}

export const productService = new ProductService();
