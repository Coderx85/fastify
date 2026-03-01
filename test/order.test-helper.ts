import {
  IOrderCreateInput,
  IAddressInput,
  TPaymentMethod,
  TCurrency,
} from "@/modules/orders/order.definition";

// ========== Mock Address Data ==========
export const mockShippingAddress: IAddressInput = {
  userId: 1,
  addressType: "shipping",
  isDefault: true,
  streetAddress1: "123 Main Street",
  streetAddress2: "Suite 100",
  city: "New York",
  state: "NY",
  postalCode: "10001",
  country: "USA",
};

export const mockBillingAddress: IAddressInput = {
  userId: 1,
  addressType: "billing",
  isDefault: false,
  streetAddress1: "456 Park Avenue",
  streetAddress2: "Building B",
  city: "Los Angeles",
  state: "CA",
  postalCode: "90001",
  country: "USA",
};

export const mockInvalidShippingAddress: IAddressInput = {
  streetAddress2: "Suite 100", // Missing required fields
  userId: 1,
  addressType: "shipping",
  isDefault: true,
  streetAddress1: "", // Invalid: empty street
  city: "New York",
  state: "NY",
  postalCode: "10001",
  country: "USA",
};

export const mockIncompleteAddress: Partial<IAddressInput> = {
  userId: 1,
  addressType: "shipping",
  streetAddress1: "123 Main Street",
  // Missing: city, state, postalCode, country
};

// ========== Mock Order Creation Data ==========
export const mockOrderWithValidProducts: IOrderCreateInput = {
  userId: 1,
  paymentMethod: "polar",
  shippingAddress: mockShippingAddress,
  billingAddress: mockBillingAddress,
  products: [
    { productId: 1, quantity: 2 },
    { productId: 2, quantity: 1 },
  ],
  notes: "Please handle with care",
};

export const mockOrderWithSingleProduct: IOrderCreateInput = {
  userId: 1,
  paymentMethod: "razorpay",
  billingAddress: mockBillingAddress,
  shippingAddress: mockShippingAddress,
  products: [{ productId: 1, quantity: 1 }],
};

export const mockOrderWithManyProducts: IOrderCreateInput = {
  userId: 1,
  paymentMethod: "polar",
  billingAddress: mockBillingAddress,
  shippingAddress: mockShippingAddress,
  products: [
    { productId: 1, quantity: 5 },
    { productId: 2, quantity: 3 },
    { productId: 3, quantity: 10 },
    { productId: 4, quantity: 2 },
    { productId: 5, quantity: 1 },
  ],
};

export const mockOrderWithLargeQuantity: IOrderCreateInput = {
  userId: 1,
  paymentMethod: "polar",
  shippingAddress: mockShippingAddress,
  billingAddress: mockBillingAddress,
  products: [{ productId: 1, quantity: 999 }],
};

export const mockOrderWithInvalidProduct: IOrderCreateInput = {
  userId: 1,
  billingAddress: mockBillingAddress,
  paymentMethod: "polar",
  shippingAddress: mockShippingAddress,
  products: [{ productId: 99999, quantity: 1 }],
};

export const mockOrderWithInvalidPaymentMethod: Partial<IOrderCreateInput> = {
  userId: 1,
  billingAddress: mockBillingAddress,
  paymentMethod: "invalid_method" as TPaymentMethod,
  shippingAddress: mockShippingAddress,
  products: [{ productId: 1, quantity: 1 }],
};

export const mockOrderWithoutShippingAddress: Partial<IOrderCreateInput> = {
  userId: 1,
  paymentMethod: "polar",
  shippingAddress: undefined,
  products: [{ productId: 1, quantity: 1 }],
};

export const mockOrderWithoutProducts: IOrderCreateInput = {
  userId: 1,
  paymentMethod: "polar",
  shippingAddress: mockShippingAddress,
  billingAddress: mockBillingAddress,
  products: [],
};

export const mockOrderWithNegativeQuantity: Partial<IOrderCreateInput> = {
  userId: 1,
  paymentMethod: "polar",
  shippingAddress: mockShippingAddress,
  products: [{ productId: 1, quantity: -5 }],
};

export const mockOrderWithZeroQuantity: Partial<IOrderCreateInput> = {
  userId: 1,
  paymentMethod: "polar",
  shippingAddress: mockShippingAddress,
  products: [{ productId: 1, quantity: 0 }],
};

export const mockOrderWithLongNotes: IOrderCreateInput = {
  userId: 1,
  paymentMethod: "polar",
  billingAddress: mockBillingAddress,
  shippingAddress: mockShippingAddress,
  products: [{ productId: 1, quantity: 1 }],
  notes: "A".repeat(1000), // Long notes
};

export const mockOrderWithSpecialCharactersInNotes: IOrderCreateInput = {
  userId: 1,
  paymentMethod: "polar",
  billingAddress: mockBillingAddress,
  shippingAddress: mockShippingAddress,
  products: [{ productId: 1, quantity: 1 }],
  notes:
    "Order with <script>alert('xss')</script> and special chars !@#$%^&*()",
};

export const mockOrderRazorpay: IOrderCreateInput = {
  userId: 2,
  paymentMethod: "razorpay",
  billingAddress: mockBillingAddress,
  shippingAddress: mockShippingAddress,
  products: [{ productId: 1, quantity: 2 }],
  notes: "Razorpay order",
};

export const mockOrderPolar: IOrderCreateInput = {
  userId: 3,
  paymentMethod: "polar",
  billingAddress: mockBillingAddress,
  shippingAddress: mockShippingAddress,
  products: [{ productId: 2, quantity: 1 }],
  notes: "Polar order",
};

// ========== Helper Functions ==========
export function createOrderPayload(
  overrides?: Partial<IOrderCreateInput>,
): IOrderCreateInput {
  return {
    ...mockOrderWithValidProducts,
    ...overrides,
  };
}

export function createAddressPayload(
  overrides?: Partial<IAddressInput>,
): IAddressInput {
  return {
    ...mockShippingAddress,
    ...overrides,
  };
}

export const PAYMENT_CURRENCY_MAP = {
  razorpay: "inr" as TCurrency,
  polar: "usd" as TCurrency,
};

export const EXCHANGE_RATES = {
  inr_to_usd: 0.012,
  usd_to_inr: 83.33,
};

// ========== Mock Database Responses ==========
export const mockProductResponse = {
  id: 1,
  name: "Test Product",
  description: "A test product",
  price: 5000,
  currency: "inr",
  stock: 100,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockOrderResponse = {
  id: 1,
  userId: 1,
  status: "processing",
  paymentMethod: "polar",
  totalAmount: 10000,
  totalAmountCurrency: "inr",
  shippingAddressId: 1,
  billingAddressId: 2,
  notes: "Please handle with care",
  createdAt: new Date(),
  updatedAt: null,
};

export const mockOrderItemResponse = {
  id: 1,
  orderId: 1,
  productId: 1,
  quantity: 2,
  priceAtOrder: 5000,
  createdAt: new Date(),
};

export const mockAddressResponse = {
  id: 1,
  userId: 1,
  addressType: "shipping",
  isDefault: true,
  streetAddress1: "123 Main Street",
  streetAddress2: "Suite 100",
  city: "New York",
  state: "NY",
  postalCode: "10001",
  country: "USA",
  createdAt: new Date(),
  updatedAt: null,
};

// ========== Validation Helpers ==========
export function isValidOrderPayload(payload: any): boolean {
  return (
    payload.userId &&
    payload.paymentMethod &&
    payload.shippingAddress &&
    Array.isArray(payload.products) &&
    payload.products.length > 0
  );
}

export function isValidAddress(address: any): boolean {
  return (
    address.streetAddress1 &&
    address.city &&
    address.state &&
    address.postalCode &&
    address.country
  );
}

export function calculateOrderTotal(
  products: Array<{ quantity: number; price: number }>,
): number {
  return products.reduce((sum, item) => sum + item.quantity * item.price, 0);
}
