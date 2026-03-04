import { PaymentInitiateRequest } from "@/schema/payment.schema";

// ========== Mock Address Data ==========

export const mockBillingAddress = {
  streetAddress1: "123 Main Street",
  streetAddress2: "Suite 100",
  city: "New York",
  state: "NY",
  postalCode: "10001",
  country: "USA",
};

export const mockShippingAddress = {
  streetAddress1: "456 Park Avenue",
  streetAddress2: "Building B",
  city: "Los Angeles",
  state: "CA",
  postalCode: "90001",
  country: "USA",
};

// ========== Mock Payment Initiation Data ==========

export const mockPaymentWithRazorpay: PaymentInitiateRequest = {
  userId: 1,
  paymentMethod: "razorpay",
  billingAddress: {
    streetAddress1: mockBillingAddress.streetAddress1,
    streetAddress2: mockBillingAddress.streetAddress2,
    city: mockBillingAddress.city,
    state: mockBillingAddress.state,
    postalCode: mockBillingAddress.postalCode,
    country: mockBillingAddress.country,
  },
  shippingAddress: {
    streetAddress1: mockShippingAddress.streetAddress1,
    streetAddress2: mockShippingAddress.streetAddress2,
    city: mockShippingAddress.city,
    state: mockShippingAddress.state,
    postalCode: mockShippingAddress.postalCode,
    country: mockShippingAddress.country,
  },
  products: [
    { productId: 1, quantity: 2 },
    { productId: 2, quantity: 1 },
  ],
  notes: "Please ship ASAP",
};

export const mockPaymentWithPolar: PaymentInitiateRequest = {
  userId: 1,
  paymentMethod: "razorpay", // Changed from "polar" - Using Razorpay only
  billingAddress: mockBillingAddress,
  shippingAddress: mockShippingAddress,
  products: [{ productId: 1, quantity: 1 }],
  notes: "Gift for birthday",
};

export const mockPaymentWithSingleProduct: PaymentInitiateRequest = {
  userId: 2,
  paymentMethod: "razorpay",
  billingAddress: mockBillingAddress,
  shippingAddress: mockShippingAddress,
  products: [{ productId: 3, quantity: 5 }],
};

export const mockPaymentWithLargeQuantity: PaymentInitiateRequest = {
  userId: 1,
  paymentMethod: "razorpay", // Changed from "polar" - Using Razorpay only
  billingAddress: mockBillingAddress,
  shippingAddress: mockShippingAddress,
  products: [{ productId: 1, quantity: 1000 }],
};

// Edge case: Invalid address (missing required fields)
export const mockPaymentWithInvalidAddress: Partial<PaymentInitiateRequest> = {
  userId: 1,
  paymentMethod: "razorpay",
  billingAddress: {
    streetAddress1: "123 Main Street",
    city: "", // Invalid: empty city
    state: "NY",
    postalCode: "10001",
    country: "USA",
  },
  shippingAddress: mockShippingAddress,
  products: [{ productId: 1, quantity: 1 }],
};

// Edge case: Empty products array
export const mockPaymentWithoutProducts: Partial<PaymentInitiateRequest> = {
  userId: 1,
  paymentMethod: "razorpay",
  billingAddress: mockBillingAddress,
  shippingAddress: mockShippingAddress,
  products: [],
};

// Edge case: Invalid product ID
export const mockPaymentWithInvalidProduct: PaymentInitiateRequest = {
  userId: 1,
  paymentMethod: "razorpay", // Changed from "polar" - Using Razorpay only
  billingAddress: mockBillingAddress,
  shippingAddress: mockShippingAddress,
  products: [{ productId: -1, quantity: 1 }],
};

// ========== Mock Razorpay Webhook Data ==========

export const mockRazorpayWebhookPayload = {
  event: "payment.authorized",
  created_at: 1577836800,
  entity: "event",
  payload: {
    payment: {
      entity: {
        id: "pay_1234567890123",
        entity: "payment",
        amount: 50000,
        currency: "INR",
        status: "captured",
        method: "card",
        description: "Payment for Order #12345",
        amount_refunded: 0,
        refund_status: null,
        captured: true,
        email: "customer@example.com",
        contact: "+919876543210",
        fee: 1062,
        tax: 0,
        error_code: null,
        error_description: null,
        order_id: "order_1234567890123",
      },
    },
  },
};

export const mockRazorpayWebhookSignature = "test_signature_123";

// ========== Mock Polar Webhook Data ==========

export const mockPolarWebhookPayload = {
  type: "checkout.created",
  data: {
    id: "checkout_test_123",
    clientSecret: "test_secret",
    clientSecretExpiresAt: Math.floor(Date.now() / 1000) + 3600,
    createdAt: new Date().toISOString(),
    amount: 5000,
    currency: "usd",
    metadata: {
      orderId: "order_123",
      userId: 1,
    },
  },
};
