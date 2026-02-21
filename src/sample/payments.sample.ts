import { TPayment } from "@/db/schema";

// Sample payments data
export const paymentsSample: TPayment[] = [
  {
    id: "checkout_1",
    orderId: 1,
    amount: 300,
    currency: "usd",
    status: "pending",
    paymentMethod: "polar",
    createdAt: new Date("2026-01-15T10:05:00Z"),
    updatedAt: new Date("2026-01-15T10:05:00Z"),
  },
  {
    id: "checkout_2",
    orderId: 2,
    amount: 400,
    currency: "usd",
    status: "succeeded",
    paymentMethod: "polar",
    createdAt: new Date("2026-01-10T14:35:00Z"),
    updatedAt: new Date("2026-01-10T14:40:00Z"),
  },
];

// Helper to add a new payment (simulating DB insert)
export function addPayment(payment: TPayment) {
  paymentsSample.push(payment);
  return payment;
}

// Helper to update a payment status
export function updatePaymentStatus(
  id: string,
  status: "pending" | "succeeded" | "failed",
) {
  const payment = paymentsSample.find((p) => p.id === id);
  if (payment) {
    payment.status = status;
  }
  return payment;
}
