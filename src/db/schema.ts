import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  pgEnum,
  index,
  boolean,
  numeric,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const categoryEnum = pgEnum("category", [
  "Electronics",
  "Clothing",
  "Books",
  "Furniture",
]);

export const categoryEnumValues = categoryEnum.enumValues;
export type TCategoryEnumValues = (typeof categoryEnumValues)[number];
export type AddressType = (typeof addressTypeEnum.enumValues)[number];

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "expired",
  "past_due",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "processing",
  "delivered",
  "cancelled",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "succeeded",
  "failed",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "polar",
  "razorpay",
]);

export const currencyEnum = pgEnum("currency", ["usd", "inr"]);
export const addressTypeEnum = pgEnum("address_type", ["shipping", "billing"]);

const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
};

export const usersTable = pgTable("userstable", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  contact: numeric("contact", { precision: 10, scale: 0 }).notNull(),
  ...timestamps,
});

export const addressesTable = pgTable(
  "addresses",
  {
    id: serial("id").primaryKey(),
    streetAddress1: varchar("street_address", { length: 255 }).notNull(),
    streetAddress2: varchar("street_address2", { length: 255 }),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 100 }),
    postalCode: varchar("postal_code", { length: 20 }).notNull(),
    country: varchar("country", { length: 100 }).notNull(),
    addressType: addressTypeEnum("address_type").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    userId: integer("user_id")
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(),
    ...timestamps,
  },
  (table) => [index("addresses_user_id_idx").on(table.userId)],
);

export const paymentsTable = pgTable(
  "payments",
  {
    id: varchar("id").primaryKey(), // from polar
    orderId: integer("order_id")
      .references(() => ordersTable.id, { onDelete: "cascade" })
      .notNull(),
    amount: integer("amount").notNull(),
    currency: currencyEnum("currency").notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    ...timestamps,
  },
  (table) => [
    index("payments_order_id_idx").on(table.orderId),
    index("payments_status_idx").on(table.status),
  ],
);

export const productsTable = pgTable(
  "productstable",
  {
    id: serial("product_id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    category: categoryEnum("category").notNull(),
    ...timestamps,
  },
  (table) => [
    index("index").on(table.name),
    index("product_id_index_column").on(table.id),
  ],
);

export const ordersTable = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(),
    totalAmount: integer("total_amount").notNull().default(0),
    totalAmountCurrency: currencyEnum("total_amount_currency").notNull(), // New column
    status: orderStatusEnum("status").notNull().default("processing"),
    billingAddressId: integer("billing_address_id")
      .references(() => addressesTable.id, { onDelete: "set null" })
      .notNull(),
    shippingAddressId: integer("shipping_address_id")
      .references(() => addressesTable.id, { onDelete: "set null" })
      .notNull(),
    paymentMethod: paymentMethodEnum("payment_method")
      .notNull()
      .default("polar"),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    index("orders_user_id_idx").on(table.userId),
    index("orders_status_idx").on(table.status),
  ],
);

// Currency table to store productstable currencies within in Rupees and Dollars
export const productsPriceTables = pgTable(
  "products_price",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .references(() => productsTable.id, { onDelete: "cascade" })
      .notNull(),
    priceAmount: integer("price_amount").notNull(),
    currencyType: currencyEnum("currency_type").notNull(),
    ...timestamps,
  },
  (table) => [
    index("product_currency_prices_product_id_idx").on(table.productId),
    index("product_currency_prices_currency_type_idx").on(table.currencyType),
  ],
);

export const orderProductTable = pgTable(
  "order_product",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .references(() => ordersTable.id, { onDelete: "cascade" })
      .notNull(),
    productId: integer("product_id")
      .references(() => productsTable.id, { onDelete: "restrict" })
      .notNull(),
    quantity: integer("quantity").notNull().default(1),
    priceAtOrder: integer("price_at_order").notNull(),
    ...timestamps,
  },
  (table) => [
    index("order_product_order_id_idx").on(table.orderId),
    index("order_product_product_id_idx").on(table.productId),
  ],
);

// Infer insert schemas from schema
export const orderInsertSchema = createInsertSchema(ordersTable);
export const orderSelectSchema = createSelectSchema(ordersTable);
export const orderProductInsertSchema = createInsertSchema(orderProductTable);
export const orderProductSelectSchema = createSelectSchema(orderProductTable);
export const paymentInsertSchema = createInsertSchema(paymentsTable);
export const paymentSelectSchema = createSelectSchema(paymentsTable);
export const addressInsertSchema = createInsertSchema(addressesTable);
export const addressSelectSchema = createSelectSchema(addressesTable);
export const productCurrencyPriceInsertSchema =
  createInsertSchema(productsPriceTables);
export const productCurrencyPriceSelectSchema =
  createSelectSchema(productsPriceTables);
export const userInsertScehama = createInsertSchema(usersTable);
export const userSelectScehema = createSelectSchema(usersTable);
export const productInsertSchema = createInsertSchema(productsTable);
export const productSelectSchema = createSelectSchema(productsTable);

// Infer types from schema
export type TCategory = (typeof categoryEnum.enumValues)[number];
export type TCurrency = (typeof currencyEnum.enumValues)[number];
export type OrderStatusType = (typeof orderStatusEnum.enumValues)[number];
export type TOrderProduct = typeof orderProductTable.$inferSelect;
export type TOrder = typeof ordersTable.$inferSelect;
export type TProduct = typeof productsTable.$inferSelect;
export type TUser = typeof usersTable.$inferSelect;
export type TPayment = typeof paymentsTable.$inferSelect;
export type TAddress = typeof addressesTable.$inferSelect;
export type TProductCurrencyPrices = typeof productsPriceTables.$inferSelect;

// Infer insert types from schema
export type TOrderProductInsert = typeof orderProductTable.$inferInsert;
export type TOrderInsert = typeof ordersTable.$inferInsert;
export type TProductInsert = typeof productsTable.$inferInsert;
export type TUserInsert = typeof usersTable.$inferInsert;
export type TPaymentInsert = typeof paymentsTable.$inferInsert;
export type TAddressInsert = typeof addressesTable.$inferInsert;
export type TProductCurrencyPricesInsert =
  typeof productsPriceTables.$inferInsert;
