import { db } from "@/db";
import { product, TCategoryEnumValues, TProduct } from "@/db/schema";
import { config } from "@/lib/config";
import { CreateProductBody, UpdateProductBody } from "@/schema/product.schema";
import { IProducts } from "@/types/payment";
import { eq } from "drizzle-orm";

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
      currency: "inr" as const, // Store prices in Indian Rupees
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
    } catch (error) {
      console.error("Error fetching products from database:", error);
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
    } catch (error) {
      throw new Error("Failed to fetch products by category", {
        cause: error,
      });
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
        throw new Error(`Product with ID ${id} not found`);
      }

      const formattedProduct = this.formatProduct(products);
      return formattedProduct;
    } catch (error) {
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
      const formattedProduct = this.formatProduct(created);
      return formattedProduct;
    } catch (error) {
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

      const updatedProduct = db
        .update(product)
        .set(data)
        .where(eq(product.id, id))
        .returning();

      return updatedProduct;
    } catch (error) {
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
      await db.delete(product).where(eq(product.id, id));
      return { deleted: true, productId: id };
    } catch (error) {
      throw new Error("Failed to delete product", {
        cause: error,
      });
    }
  }
}

export const productService = new ProductService();
