import { db } from "@/db";
import { product, TCategoryEnumValues, TProduct, productCurrencyPrices, currencyEnum } from "@/db/schema";
import { config } from "@/lib/config";
import { CreateProductBody, UpdateProductBody } from "@/schema/product.schema";
import { IProducts } from "@/types/payment";
import { eq, and } from "drizzle-orm";
import { STATUS_CODES } from "http";

class ProductService {
  /**
   * Check if Polar API is configured
   */
  private isPolarConfigured(): boolean {
    return !!(config.POLAR_ACCESS_TOKEN && config.POLAR_ORGANIZATION_ID);
  }

  public convertToPaises(priceInDecimal: number): number {
    return Math.round(priceInDecimal * 100); // Convert decimal price to base units (e.g., cents)
  }

  private async formatProduct(
    baseProduct: TProduct,
    currencyCode: (typeof currencyEnum.enumValues)[number],
  ): Promise<IProducts> {
    const [priceEntry] = await db
      .select()
      .from(productCurrencyPrices)
      .where(
        and(
          eq(productCurrencyPrices.productId, baseProduct.productId),
          eq(productCurrencyPrices.currencyType, currencyCode)
        )
      )
      .limit(1);

    const price = priceEntry ? priceEntry.priceAmount / 100 : baseProduct.price / 100; // Fallback to base product price if no specific entry

    return {
      ...baseProduct,
      // For now, product.price in schema.ts will hold the base price (e.g., in USD)
      // This `price` here is the *formatted* price for display, in the target currency.
      price: price,
      currency: currencyCode,
    };
  }

  private async formatProducts(
    baseProducts: TProduct[],
    currencyCode: (typeof currencyEnum.enumValues)[number],
  ): Promise<IProducts[]> {
    const formattedProducts: IProducts[] = [];
    for (const p of baseProducts) {
      formattedProducts.push(await this.formatProduct(p, currencyCode));
    }
    return formattedProducts;
  }

  /**
   * Get all products
   * @param currencyCode Optional: desired currency for prices
   * @returns Array of products with prices in specified currency
   */
  async getAllProducts(
    currencyCode: (typeof currencyEnum.enumValues)[number] = "usd"
  ): Promise<IProducts[]> {
    try {
      const products = await db.select().from(product);
      return await this.formatProducts(products, currencyCode);
    } catch (error) {
      console.error("Error fetching all products:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch products",
        {
          cause: error,
        },
      );
    }
  }

  /**
   * Get products by category
   * @param query Category enum value
   * @param currencyCode Optional: desired currency for prices
   * @returns Array of products with prices in specified currency
   */
  async getProductByQuery(
    query: TCategoryEnumValues,
    currencyCode: (typeof currencyEnum.enumValues)[number] = "usd"
  ): Promise<IProducts[]> {
    try {
      const baseProducts = await db
        .select()
        .from(product)
        .where(eq(product.category, query))
        .execute();

      return await this.formatProducts(baseProducts, currencyCode);
    } catch (error) {
      console.error("Failed to fetch products by category:", error);
      throw new Error("Failed to fetch products by category", {
        cause: error,
      });
    }
  }

  /**
   * Get product by ID
   * @param id Product ID
   * @param currencyCode Optional: desired currency for the price
   * @returns Product object with price in specified currency
   */
  async getProductById(
    id: number,
    currencyCode: (typeof currencyEnum.enumValues)[number] = "usd" // Default to USD
  ): Promise<IProducts> {
    try {
      const [baseProduct] = await db
        .select()
        .from(product)
        .where(eq(product.productId, id))
        .limit(1);

      if (!baseProduct) {
        throw new Error(`Product with ID ${id} not found`);
      }

      return await this.formatProduct(baseProduct, currencyCode);
    } catch (error) {
      console.error("Failed to fetch product by ID:", error);
      throw new Error("Failed to fetch product by ID", {
        cause: error,
      });
    }
  }

  /**
   * Create a new product
   * @param data Create product data
   * @returns Created product
   */
  async createProduct(data: CreateProductBody) {
    try {
      const basePriceInPaises = this.convertToPaises(data.price);

      const [createdProduct] = await db
        .insert(product)
        .values({
          name: data.name,
          description: data.description,
          price: basePriceInPaises, // Store base price in product table (e.g., in USD equivalent)
          category: data.category,
        })
        .returning();

      if (!createdProduct) {
        throw new Error("Failed to create base product");
      }

      // Insert currency prices for USD and INR
      // In a real app, you'd use a currency conversion API here.
      await db.insert(productCurrencyPrices).values([
        {
          productId: createdProduct.productId,
          priceAmount: basePriceInPaises, // Assuming base price is USD
          currencyType: "usd",
        },
        {
          productId: createdProduct.productId,
          priceAmount: this.convertToPaises(data.price * 80), // Example: 1 USD = 80 INR
          currencyType: "inr",
        },
      ]);

      // Return the product with its USD price by default
      return await this.formatProduct(createdProduct, "usd");
    } catch (error) {
      console.error("Failed to create product:", error);
      throw new Error("Failed to create product", {
        cause: error,
      });
    }
  }

  /**
   * Update an existing product
   * @param id Product ID
   * @param data Update product data
   * @returns Updated product or null if not found
   */
  async updateProduct(id: number, data: UpdateProductBody) {
    try {
      const existingProduct = await this.getProductById(id);

      if (!existingProduct) {
        throw new Error(`Product with ID ${id} not found`);
      }

      const updatePayload: Partial<TProduct> = {
        name: data.name,
        description: data.description,
        category: data.category,
      };

      if (data.price !== undefined) {
        updatePayload.price = this.convertToPaises(data.price);
        // Also update the price in productCurrencyPrices for the default currency (e.g., USD)
        await db.update(productCurrencyPrices)
          .set({ priceAmount: this.convertToPaises(data.price) })
          .where(and(
            eq(productCurrencyPrices.productId, id),
            eq(productCurrencyPrices.currencyType, "usd")
          ));
        // Note: For other currencies, you'd need logic to update/recalculate them
      }

      const [updated] = await db
        .update(product)
        .set(updatePayload)
        .where(eq(product.id, id))
        .returning();

      return await this.formatProduct(updated, "usd"); // Return updated product with default USD price
    } catch (error) {
      console.error("Failed to update product:", error);
      throw new Error("Failed to update product", {
        cause: error,
      });
    }
  }

  /**
   * Delete a product
   * @param id Product ID
   * @returns Deletion status
   */
  async deleteProduct(id: number) {
    try {
      // Delete associated currency prices first to satisfy foreign key constraints
      await db.delete(productCurrencyPrices).where(eq(productCurrencyPrices.productId, id));

      const res = await db.delete(product).where(eq(product.id, id));
      if (res.rowCount === 0) {
        throw new Error(`Product with ID ${id} not found`, {
          cause: {
            code: 404,
          },
        });
      }
      return { deleted: true, productId: id };
    } catch (error: any) {
      if (error.cause && error.cause.code === 404) {
        throw new Error(`Product with ID ${id} not found`, {
          cause: {
            code: STATUS_CODES[404],
          },
        });
      }
      console.error("Failed to delete product:", error);
      throw new Error("Failed to delete product", {
        cause: error,
      });
    }
  }
}

export const productService = new ProductService();
