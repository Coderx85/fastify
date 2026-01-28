// import { db } from "@/db";
// import { product, TCategoryEnumValues } from "@/db/schema";
import { TCategoryEnumValues, TProduct } from "@/db/schema";
import {
  productsSample,
  getNextId,
  getNextProductId,
} from "@/sample/products.sample";
import { CreateProductBody, UpdateProductBody } from "@/schema/product.schema";
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

    const foundProduct = productsSample.find((p) => p.productId === id);
    return foundProduct || null;
  }

  /**
   * Create a new product
   * @param data Create product data
   * @returns Created product
   */
  async createProduct(data: CreateProductBody) {
    const newProduct: TProduct = {
      id: getNextId(),
      productId: getNextProductId(),
      ...data,
    };

    // await db.insert(product).values(newProduct);
    productsSample.push(newProduct);
    return newProduct;
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
