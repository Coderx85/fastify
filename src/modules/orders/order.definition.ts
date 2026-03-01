import { OrderStatusType, TAddress, TOrder } from "@/db/schema";
import { CreateOrderInput, CreateOrderOutput } from "@/schema/order.schema";
import { FastifyReply } from "fastify";
import { FastifyRequest } from "fastify/types/request";

export const orderCreatedDate = new Date();

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
export interface IOrderCreateInput extends CreateOrderInput {}

// ========== Order DTO Types ==========
export interface IOrderDTO extends CreateOrderOutput {}

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

export type getAllOrdersOptions = {
  userId?: number;
  status?: OStatusType;
  limit?: number;
  offset?: number;
};

// ========== Service Interface ==========
export interface IOrderService {
  createOrder(data: IOrderCreateInput, userId: number): Promise<IOrderResult>;
  getOrdersByUserId(orderId: number, userId: number): Promise<IOrderResult[]>;
  getOrderById(orderId: number): Promise<IOrderResult | null>;
  getAllOrders(
    options?: getAllOrdersOptions,
  ): Promise<{ orders: IOrderResult[]; total: number }>;
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
  createOrderHandler(
    request: FastifyRequest<{ Body: IOrderInput }>,
    reply: FastifyReply,
  ): Promise<void>;

  getOrderByIdHandler(
    request: FastifyRequest<{ Params: { orderId: number } }>,
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
