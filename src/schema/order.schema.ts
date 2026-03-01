import { z } from "zod";
import {
  ordersTable as orders,
  orderProductTable as orderProduct,
  orderStatusEnum,
  paymentMethodEnum,
  orderInsertSchema,
  currencyEnum,
  addressInsertSchema,
} from "@/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { successResponseSchema } from "@/types/api";

// Base schemas from Drizzle
export const orderSchema = createSelectSchema(orders);
export const orderProductSchema = createSelectSchema(orderProduct);

// Order status enum values for validation
export const orderStatusValues = orderStatusEnum.enumValues;

// Product item in create order request
export const orderProductInputSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
});

// Create order request body
export const createOrderBodySchema = z.object({
  userId: z.number().int().positive(),
  shippingAddress: z.string(),
  paymentMethod: z.enum(paymentMethodEnum.enumValues),
  notes: z.string(),
  products: z
    .array(orderProductInputSchema)
    .min(1, "At least one product is required"),
});

// Order with products response data
export const orderWithProductsSchema = z.object({
  order: orderSchema,
  products: z.array(orderProductSchema),
});

// // Create order response schema
// export const createOrderSchema = {
//   body: createOrderBodySchema,
//   response: {
//     201: successResponseSchema(orderWithProductsSchema),
//   },
// };

// ============ Get Order Schemas ============

// export const getOrderByIdSchema = {
//   params: z.object({
//     orderId: z.coerce.number().int().positive(),
//   }),
//   response: {
//     200: successResponseSchema(orderWithProductsSchema),
//   },
// };

// Update order details body (all fields optional)
export const updateOrderBodySchema = z.object({
  status: z.enum(orderStatusValues).optional(),
  shippingAddress: z.string().optional(),
  paymentMethod: z.string().max(50).optional(),
  notes: z.string().optional(),
});

// Update order route schema
export const updateOrderSchema = {
  params: z.object({
    orderId: z.coerce.number().int().positive(),
  }),
  body: updateOrderBodySchema,
  response: {
    200: successResponseSchema(orderWithProductsSchema),
  },
};

// Add product to order body
export const addProductToOrderBodySchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
});

// Add product to order route schema
export const addProductToOrderSchema = {
  params: z.object({
    orderId: z.coerce.number().int().positive(),
  }),
  body: addProductToOrderBodySchema,
  response: {
    200: successResponseSchema(orderWithProductsSchema),
  },
};

// Remove product from order route schema
export const removeProductFromOrderSchema = {
  params: z.object({
    orderId: z.coerce.number().int().positive(),
    productId: z.coerce.number().int().positive(),
  }),
  response: {
    200: successResponseSchema(orderWithProductsSchema),
  },
};

// ============ Get All Orders Schema ============

// All orders response data
export const allOrdersDataSchema = z.object({
  orders: z.array(orderWithProductsSchema),
  total: z.number(),
});

// Get all orders (admin) route schema
export const getAllOrdersSchema = {
  querystring: z.object({
    userId: z.coerce.number().int().positive().optional(),
    status: z.enum(orderStatusValues).optional(),
    limit: z.coerce.number().int().positive().default(10).optional(),
    offset: z.coerce.number().int().nonnegative().default(0).optional(),
  }),
  response: {
    200: successResponseSchema(allOrdersDataSchema),
  },
};

// ============ Delete Order Schema ============

// Delete order success response
export const deleteOrderResponseSchema = z.object({
  deleted: z.boolean(),
  orderId: z.number(),
});

// Delete order route schema
export const deleteOrderSchema = {
  params: z.object({
    orderId: z.coerce.number().int().positive(),
  }),
  response: {
    200: successResponseSchema(deleteOrderResponseSchema),
  },
};

// ============ Type Exports ============
export type CreateOrderBody = z.infer<typeof createOrderBodySchema>;
export type OrderProductInput = z.infer<typeof orderProductInputSchema>;
export type OrderWithProducts = z.infer<typeof orderWithProductsSchema>;
export type GetOrderByIdParams = z.infer<typeof getOrderByIdSchema.params>;
export type UpdateOrderBody = z.infer<typeof updateOrderBodySchema>;
export type UpdateOrderParams = z.infer<typeof updateOrderSchema.params>;
export type AddProductToOrderBody = z.infer<typeof addProductToOrderBodySchema>;
export type AddProductToOrderParams = z.infer<
  typeof addProductToOrderSchema.params
>;
export type RemoveProductFromOrderParams = z.infer<
  typeof removeProductFromOrderSchema.params
>;
export type GetAllOrdersQuery = z.infer<typeof getAllOrdersSchema.querystring>;
export type AllOrdersData = z.infer<typeof allOrdersDataSchema>;
export type DeleteOrderParams = z.infer<typeof deleteOrderSchema.params>;
export type DeleteOrderResponse = z.infer<typeof deleteOrderResponseSchema>;

///// ========== Additional Types for Service Layer ==========

const currencyValues = z.enum(currencyEnum.enumValues);

const addressInput = addressInsertSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
});

const orderItemInputSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
});

// POST - /api/order
const createOrderInputBaseSchema = orderInsertSchema
  .pick({
    userId: true,
    paymentMethod: true,
    notes: true,
  })
  .extend({
    billingAddress: addressInput,
    shippingAddress: addressInput,
    products: z
      .array(orderItemInputSchema)
      .min(1, "At least one product is required"),
  });

const createOrderOutputBaseSchema = orderInsertSchema
  .omit({
    shippingAddressId: true,
    billingAddressId: true,
  })
  .extend({
    shippingAddress: addressInput.omit({ addressType: true, isDefault: true }),
    billingAddress: addressInput.omit({ addressType: true, isDefault: true }),
    items: z.array(orderItemInputSchema),
    pricing: z.object({
      originalAmount: z.number().nonnegative(),
      convertedAmount: z.number().nonnegative(),
      currency: currencyValues,
      exchangeRate: z.number().positive(),
    }),
  });

export const createOrderSchema = {
  body: createOrderInputBaseSchema,
  response: {
    201: successResponseSchema(createOrderOutputBaseSchema),
  },
};
export type CreateOrderInput = z.infer<typeof createOrderInputBaseSchema>;
export type CreateOrderOutput = z.infer<typeof createOrderOutputBaseSchema>;

// GET - /api/order/:orderId

export const getOrderByIdSchema = {
  params: z.object({
    orderId: z.coerce.number().int().positive(),
  }),
  response: {
    200: successResponseSchema(createOrderOutputBaseSchema),
  },
};

export type GetOrderByIdInput = z.infer<typeof getOrderByIdSchema.params>;
export type GetOrderByIdOutput = z.infer<typeof createOrderOutputBaseSchema>;

// PUT - /api/order/:orderId

export type UpdateOrderInput = z.infer<typeof updateOrderBodySchema>;

export const orderResultSchema = createOrderOutputBaseSchema;
