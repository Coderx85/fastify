import {
  OrderStatusType,
  TAddress,
  TOrder,
  AddressType,
  TProduct,
} from "@/db/schema";
import { FastifyReply } from "fastify";
import { FastifyRequest } from "fastify/types/request";

export interface IOrder extends TOrder {}

export type OStatusType = OrderStatusType;
export type TPaymentMethod = "razorpay" | "polar";
export type TCurrency = "inr" | "usd";

// ========== Address Types ==========
export interface IAddressInput extends Omit<
  TAddress,
  "id" | "createdAt" | "updatedAt"
> {}

export interface IAddressOutput extends TAddress {}

// ========== Order Item Types ==========
export interface IOrderItemInput {
  productId: number;
  quantity: number;
}

export interface IOrderItemOutput {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  priceAtOrder: number;
  createdAt: Date;
}

// ========== Order Creation Input Types ==========
export interface IOrderCreateInput {
  userId: number;
  paymentMethod: TPaymentMethod;
  shippingAddress: IAddressInput;
  billingAddress?: IAddressInput;
  products: IOrderItemInput[];
  notes?: string;
}

// ========== Order DTO Types ==========
export interface IOrderDTO extends IOrderCreateInput {}

export interface IOrderInput extends IOrderCreateInput {}

// ========== Order Result/Output Types ==========
export interface IOrderPricing {
  originalAmount: number;
  convertedAmount: number;
  currency: TCurrency;
  exchangeRate: number;
}

export interface IOrderResult extends IOrder {
  shippingAddress: IAddressOutput;
  billingAddress: IAddressOutput;
  items: IOrderItemOutput[];
  pricing: IOrderPricing;
}

export interface IOrderWithProducts {
  order: IOrder;
  products: IOrderItemOutput[];
  pricing: IOrderPricing;
}

// ========== Service Interface ==========
export interface IOrderService {
  createOrder(userId: number, data: IOrderCreateInput): Promise<IOrderResult>;
  // getOrderById(orderId: number, userId: number): Promise<IOrderResult | null>;
  // getOrdersByUserId(userId: number): Promise<IOrderResult[]>;
  // getAllOrders(options?: {
  //   userId?: number;
  //   status?: OStatusType;
  //   limit?: number;
  //   offset?: number;
  // }): Promise<{ orders: IOrderResult[]; total: number }>;
}

// ========== Controller Interface ==========
export interface IOrderController {
  createOrder(
    request: FastifyRequest<{ Body: IOrderInput }>,
    reply: FastifyReply,
  ): Promise<void>;
}
export class OrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderValidationError";
  }
}

export class OrderNotFoundError extends Error {
  constructor(orderId: number) {
    super(`Order with ID ${orderId} not found`);
    this.name = "OrderNotFoundError";
  }
}

export class InvalidProductError extends Error {
  constructor(productId: number) {
    super(`Product with ID ${productId} not found or invalid`);
    this.name = "InvalidProductError";
  }
}

export class InsufficientAddressError extends Error {
  constructor(message: string = "Shipping address is required") {
    super(message);
    this.name = "InsufficientAddressError";
  }
}

// ========== Example Data ==========
export const addressInputExample: IAddressInput = {
  userId: 1,
  addressType: "shipping",
  isDefault: true,
  streetAddress1: "123 Main St",
  streetAddress2: "Apt 4B",
  city: "Anytown",
  state: "CA",
  postalCode: "12345",
  country: "USA",
};

export const orderCreateInputExample: IOrderCreateInput = {
  userId: 1,
  paymentMethod: "polar",
  shippingAddress: addressInputExample,
  billingAddress: addressInputExample,
  products: [
    {
      productId: 1,
      quantity: 2,
    },
    {
      productId: 2,
      quantity: 1,
    },
  ],
  notes: "Please deliver between 9 AM and 5 PM.",
};

export const addressOutputExample: IAddressOutput = {
  id: 1,
  userId: 1,
  addressType: "shipping",
  isDefault: true,
  streetAddress1: "123 Main St",
  streetAddress2: "Apt 4B",
  city: "Anytown",
  state: "CA",
  postalCode: "12345",
  country: "USA",
  createdAt: new Date(),
  updatedAt: null,
};

export const orderResultExample: IOrderResult = {
  id: 1,
  userId: 1,
  status: "processing",
  createdAt: new Date(),
  billingAddressId: 2,
  shippingAddressId: 1,
  paymentMethod: "polar",
  totalAmount: 10000,
  totalAmountCurrency: "inr",
  updatedAt: null,
  notes: "Please deliver between 9 AM and 5 PM.",
  shippingAddress: addressOutputExample,
  billingAddress: addressOutputExample,
  items: [
    {
      id: 1,
      orderId: 1,
      productId: 1,
      quantity: 2,
      priceAtOrder: 5000,
      createdAt: new Date(),
    },
  ],
  pricing: {
    originalAmount: 10000,
    convertedAmount: 120,
    currency: "usd",
    exchangeRate: 0.012,
  },
};
