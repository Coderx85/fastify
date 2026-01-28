// import { db } from "@/db";
// import { product, TCategoryEnumValues } from "@/db/schema";
import { TCategoryEnumValues } from "@/db/schema";
import { productsSample } from "@/sample/products.sample";
// import { eq } from "drizzle-orm";

export class ProductService {
  /**
   * Get all products
   * @returns Array of products
   */
  async getAllProducts() {
    // const products = await db.select().from(product);
    const products = productsSample;
    return products;
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
    // const products = await db
    //   .select()
    //   .from(product)
    //   .where(eq(product.productId, id));

    const products = productsSample.filter(
      (product) => product.productId === id,
    );
    return products[0];
  }
}
