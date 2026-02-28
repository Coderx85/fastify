import type { categoryEnum, currencyEnum } from "@/db/schema";
import {
  createProductResultSchema,
  createProductInputSchema,
} from "@/schema/product.schema";
import z from "zod";

export type RateMap = Record<currencyType, number>;

type createProductInput = z.infer<typeof createProductInputSchema>;

export interface IProductInput extends createProductInput {}

const p: IProductInput = {
  name: "Sample Product",
  description: "This is a sample product",
  category: "Books",
  amount: 19.99,
  currency: "inr",
  createdAt: new Date(),
  id: 1,
};

export type CreateProductResult = z.infer<typeof createProductResultSchema>;

export interface IProduct extends CreateProductResult {}

export type currencyType = (typeof currencyEnum.enumValues)[number];

export interface IProductDTO extends IProductInput {
  id?: number | undefined;
  description: string;
  category: productCategoryType;
  createdAt: Date;
  updatedAt?: Date | undefined;
  amount: number;
  currency: currencyType;
}

export type productCategoryType = (typeof categoryEnum.enumValues)[number];

export interface IProductService {
  createProduct(input: IProductInput): Promise<IProduct | null>;

  getProducts(): Promise<IProduct[] | null>;

  getProductById(id: number): Promise<IProduct | null>;

  updateProduct(
    id: number,
    input: Partial<IProductInput>,
  ): Promise<IProduct | null>;
}
