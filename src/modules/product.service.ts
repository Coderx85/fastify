import { db } from "@/db";
import { product, TCategoryEnumValues, TProduct } from "@/db/schema";
import { config } from "@/lib/config";
import { productsSample } from "@/sample/products.sample";
import { CreateProductBody, UpdateProductBody } from "@/schema/product.schema";
import { Polar } from "@polar-sh/sdk";
import { eq } from "drizzle-orm";

const polar = new Polar({
  accessToken: config.POLAR_ACCESS_TOKEN,
  server: "sandbox",
});

export class ProductService {
  /**
   * Check if Polar API is configured
   */
  private isPolarConfigured(): boolean {
    return !!(config.POLAR_ACCESS_TOKEN && config.POLAR_ORGANIZATION_ID);
  }

  /**
   * Get all products
   * Falls back to sample data if Polar API is not configured or fails
   * @returns Array of products
   */
  async getAllProducts() {
    // If Polar is not configured, return sample data
    if (!this.isPolarConfigured()) {
      console.log("Polar API not configured, returning sample products");
      return productsSample;
    }

    try {
      const products = await polar.products.list({
        organizationId: config.POLAR_ORGANIZATION_ID,
      });

      const result = products.result.items;

      // If no products from Polar, return sample data
      if (!result || result.length === 0) {
        console.log("No products from Polar API, returning sample products");
        return productsSample;
      }

      const productsData: TProduct[] = result.map((item) => {
        // Safely get the first price and its amount
        const firstPrice =
          item.prices && item.prices.length > 0 ? item.prices[0] : null;
        let priceAmount = 0;

        if (firstPrice && "priceAmount" in firstPrice) {
          priceAmount = firstPrice.priceAmount;
        }

        return {
          // Polar IDs are strings, so we provide default numeric IDs for the local schema
          id: 0,
          productId: 0,
          name: item.name || "",
          description: item.description || "",
          price: priceAmount,
          category: "Books",
        };
      });
      return productsData;
    } catch (error) {
      // If Polar API fails, fallback to sample data
      console.error("Polar API error, falling back to sample products:", error);
      return productsSample;
    }
  }

  /**
   * Get products by category
   * @param query Category enum value
   * @returns Array of products
   */
  async getProductByQuery(query: TCategoryEnumValues) {
    // const products = await db
    //   .select()
    //   .from(product)
    //   .where(eq(product.category, query));

    const products = productsSample.filter(
      (product) => product.category === query,
    );
    return products;
  }

  /**
   * Get product by ID
   * @param id Product ID
   * @returns Product object
   */
  async getProductById(id: number) {
    const [products] = await db
      .select()
      .from(product)
      .where(eq(product.productId, id));

    // const foundProduct = productsSample.find((p) => p.productId === id);
    return products;
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
          price: data.price,
          category: data.category,
        })
        .returning({
          id: product.id,
          productId: product.productId,
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
        });

      if (!created) {
        throw new Error("Failed to create product");
      }

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
    const productIndex = productsSample.findIndex((p) => p.productId === id);

    if (productIndex === -1) {
      return null;
    }

    const updatedProduct = {
      ...productsSample[productIndex],
      ...data,
    };

    // await db.update(product).set(data).where(eq(product.productId, id));
    productsSample[productIndex] = updatedProduct;
    return updatedProduct;
  }

  /**
   * Delete a product
   * @param id Product ID
   * @returns Deletion status
   */
  async deleteProduct(id: number) {
    const productIndex = productsSample.findIndex((p) => p.productId === id);

    if (productIndex === -1) {
      return { deleted: false, productId: id };
    }

    // await db.delete(product).where(eq(product.productId, id));
    productsSample.splice(productIndex, 1);
    return { deleted: true, productId: id };
  }
}
