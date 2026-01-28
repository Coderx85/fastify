import { TOrder, TOrderProduct } from "@/db/schema";

// Sample orders data
export const ordersSample: TOrder[] = [
  {
    id: 1,
    userId: 1,
    totalAmount: 300, // 100 + 200 (product 1 + product 2)
    status: "processing",
    shippingAddress: "123 Main St, City, Country",
    paymentMethod: "credit_card",
    notes: "Please deliver before 5 PM",
    createdAt: new Date("2026-01-15T10:00:00Z"),
    updatedAt: new Date("2026-01-15T10:00:00Z"),
  },
  {
    id: 2,
    userId: 1,
    totalAmount: 400, // product 4 (Electronics)
    status: "delivered",
    shippingAddress: "456 Oak Ave, Town, Country",
    paymentMethod: "paypal",
    notes: null,
    createdAt: new Date("2026-01-10T14:30:00Z"),
    updatedAt: new Date("2026-01-12T09:00:00Z"),
  },
  {
    id: 3,
    userId: 2,
    totalAmount: 1800, // 500 + 600 + 700 (products 5, 6, 7)
    status: "cancelled",
    shippingAddress: "789 Pine Rd, Village, Country",
    paymentMethod: "bank_transfer",
    notes: "Customer requested cancellation",
    createdAt: new Date("2026-01-20T08:15:00Z"),
    updatedAt: new Date("2026-01-21T11:00:00Z"),
  },
];

// Sample order products (junction table data)
export const orderProductsSample: TOrderProduct[] = [
  // Order 1: 2 products
  {
    id: 1,
    orderId: 1,
    productId: 134213432, // Product 1
    quantity: 1,
    priceAtOrder: 100,
    createdAt: new Date("2026-01-15T10:00:00Z"),
  },
  {
    id: 2,
    orderId: 1,
    productId: 134213432, // Product 2
    quantity: 1,
    priceAtOrder: 200,
    createdAt: new Date("2026-01-15T10:00:00Z"),
  },
  // Order 2: 1 product
  {
    id: 3,
    orderId: 2,
    productId: 134213432, // Product 4
    quantity: 1,
    priceAtOrder: 400,
    createdAt: new Date("2026-01-10T14:30:00Z"),
  },
  // Order 3: 3 products
  {
    id: 4,
    orderId: 3,
    productId: 134213432, // Product 5
    quantity: 1,
    priceAtOrder: 500,
    createdAt: new Date("2026-01-20T08:15:00Z"),
  },
  {
    id: 5,
    orderId: 3,
    productId: 134213432, // Product 6
    quantity: 1,
    priceAtOrder: 600,
    createdAt: new Date("2026-01-20T08:15:00Z"),
  },
  {
    id: 6,
    orderId: 3,
    productId: 134213432, // Product 7
    quantity: 1,
    priceAtOrder: 700,
    createdAt: new Date("2026-01-20T08:15:00Z"),
  },
];

// Counters for generating new IDs (for in-memory operations)
export let nextOrderId = 4;
export let nextOrderProductId = 7;

// Helper functions to update counters
export function getNextOrderId(): number {
  return nextOrderId++;
}

export function getNextOrderProductId(): number {
  return nextOrderProductId++;
}
