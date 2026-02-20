import { db } from "@/db";
import {
  currencyEnum,
  product,
  TCategoryEnumValues,
  TProduct,
} from "@/db/schema";
import { config } from "@/lib/config";
import { CreateProductBody, UpdateProductBody } from "@/schema/product.schema";
import { IProducts } from "@/types/payment";
import { Polar } from "@polar-sh/sdk";
import { eq } from "drizzle-orm";
import { STATUS_CODES } from "http";

let polar: Polar | null = null;

function getPolarInstance(): Polar | null {
  if (!config.POLAR_ACCESS_TOKEN) {
    return null;
  }
  if (!polar) {
    polar = new Polar({
      accessToken: config.POLAR_ACCESS_TOKEN,
      server: "sandbox",
    });
  }
  return polar;
}

class ProductService {
  /**
   * Check if Polar API is configured
   */
  private isPolarConfigured(): boolean {
    return !!(config.POLAR_ACCESS_TOKEN && config.POLAR_ORGANIZATION_ID);
  }

  private convertToPaises(priceInRupees: number): number {
    return Math.round(priceInRupees * 100); // Convert rupees to paises
  }

  private formatProduct(product: TProduct): IProducts {
    return {
      ...product,
      price: product.price / 100, // Convert paises to rupees
      currency: currencyEnum.enumValues["1"],
    };
  }

  private formatProducts(products: TProduct[]): IProducts[] {
    return products.map((product) => this.formatProduct(product));
  }

  /**
   * Get all products
   * Falls back to sample data if Polar API is not configured or fails
   * @returns Array of products
   */
  async getAllProducts() {
    try {
      const products = await db.select().from(product);

      // Be default currency is in paises, convert to rupees and dollars in the application layer
      const formattedProducts: IProducts[] = this.formatProducts(products);

      return formattedProducts;
    } catch (error: unknown) {
      console.error("Error fetching products from database:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch products",
      );
    }
  }

  /**
   * Get products by category
   * @param query Category enum value
   * @returns Array of products
   */
  async getProductByQuery(query: TCategoryEnumValues): Promise<IProducts[]> {
    try {
      const products = await db
        .select()
        .from(product)
        .where(eq(product.category, query))
        .execute();

      const formattedProducts = this.formatProducts(products);
      return formattedProducts;
    } catch (error: unknown) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to fetch products by category",
      );
    }
  }

  /**
   * Get product by ID
   * @param id Product ID
   * @returns Product object
   */
  async getProductById(id: number) {
    try {
      const [products] = await db
        .select()
        .from(product)
        .where(eq(product.id, id));

      if (!products) {
        throw new Error(`Product with ID ${id} not found`, {
          cause: {
            STATUS_CODES: STATUS_CODES["404"],
          },
        });
      }

      const formattedProduct = this.formatProduct(products);
      return formattedProduct;
    } catch (error: unknown) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to fetch product by ID",
        {
          cause: {
            STATUS_CODES: STATUS_CODES["500"],
          },
        },
      );
    }
  }

  /**
   * Create a new product
   * @param data Create product data
   * @returns Created product
   */
  async createProduct(data: CreateProductBody) {
    // Let the database assign serial `id` / `product_id` values — do not pass them manually.
    try {
      const [created] = await db
        .insert(product)
        .values({
          name: data.name,
          description: data.description,
          price: this.convertToPaises(data.price),
          category: data.category,
        })
        .returning();

      return created;
    } catch (error) {
      throw error;
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
        throw new Error(`Product with ID ${id} not found`, {
          cause: {
            STATUS_CODES: STATUS_CODES["404"],
          },
        });
      }

      const updatedProduct = db
        .update(product)
        .set(data)
        .where(eq(product.id, id))
        .returning();

      return updatedProduct;
    } catch (error: unknown) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to update product",
      );
    }
  }

  /**
   * Delete a product
   * @param id Product ID
   * @returns Deletion status
   */
  async deleteProduct(id: number) {
    try {
      await db.delete(product).where(eq(product.id, id));
      return { deleted: true, productId: id };
    } catch (error: unknown) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to delete product",
      );
    }
  }
}

export const productService = new ProductService();
