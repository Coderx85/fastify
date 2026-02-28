import { relations } from "drizzle-orm";
import {
  productsTable,
  productsPriceTables,
  ordersTable,
  usersTable,
  orderProductTable,
  addressesTable,
  paymentsTable,
} from "./schema";

// Products can have many prices (INR, USD) and many order items
export const productsRelations = relations(productsTable, ({ many }) => ({
  prices: many(productsPriceTables),
  orderProducts: many(orderProductTable),
}));

// Price belongs to one product
export const productsPriceRelations = relations(
  productsPriceTables,
  ({ one }) => ({
    product: one(productsTable, {
      fields: [productsPriceTables.productId],
      references: [productsTable.id],
    }),
  }),
);

// Order belongs to one user, has addresses, payment, and many products
export const ordersRelations = relations(ordersTable, ({ many, one }) => ({
  user: one(usersTable, {
    fields: [ordersTable.userId],
    references: [usersTable.id],
  }),
  billingAddress: one(addressesTable, {
    fields: [ordersTable.billingAddressId],
    references: [addressesTable.id],
    relationName: "billingAddress",
  }),
  shippingAddress: one(addressesTable, {
    fields: [ordersTable.shippingAddressId],
    references: [addressesTable.id],
    relationName: "shippingAddress",
  }),
  orderProducts: many(orderProductTable),
  payment: one(paymentsTable),
}));

// Junction table connecting orders and products
export const orderProductRelations = relations(
  orderProductTable,
  ({ one }) => ({
    order: one(ordersTable, {
      fields: [orderProductTable.orderId],
      references: [ordersTable.id],
    }),
    product: one(productsTable, {
      fields: [orderProductTable.productId],
      references: [productsTable.id],
    }),
  }),
);

// User has many orders and addresses
export const usersRelations = relations(usersTable, ({ many }) => ({
  orders: many(ordersTable),
  addresses: many(addressesTable),
}));

// Address belongs to one user
export const addressesRelations = relations(addressesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [addressesTable.userId],
    references: [usersTable.id],
  }),
}));

// Payment belongs to one order
export const paymentsRelations = relations(paymentsTable, ({ one }) => ({
  order: one(ordersTable, {
    fields: [paymentsTable.orderId],
    references: [ordersTable.id],
  }),
}));
