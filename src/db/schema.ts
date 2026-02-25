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

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  contact: numeric("contact", { precision: 10, scale: 0 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const addresses = pgTable(
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
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("addresses_user_id_idx").on(table.userId)],
);

export const payments = pgTable(
  "payments",
  {
    id: varchar("id").primaryKey(), // from polar
    orderId: integer("order_id")
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    amount: integer("amount").notNull(),
    currency: currencyEnum("currency").notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("payments_order_id_idx").on(table.orderId),
    index("payments_status_idx").on(table.status),
  ],
);

export const product = pgTable(
  "product",
  {
    id: serial("id"),
    productId: serial("product_id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    price: integer("price").notNull(), // store price in cents and convert to rupees and dollar in the application layer
    category: categoryEnum("category").notNull(),
  },
  (table) => [
    index("index").on(table.name),
    index("product_id_index_column").on(table.productId),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    totalAmount: integer("total_amount").notNull().default(0),
    totalAmountCurrency: currencyEnum("total_amount_currency").notNull(), // New column
    status: orderStatusEnum("status").notNull().default("processing"),
    billingAddressId: integer("billing_address_id")
      .references(() => addresses.id, { onDelete: "set null" })
      .notNull(),
    shippingAddressId: integer("shipping_address_id")
      .references(() => addresses.id, { onDelete: "set null" })
      .notNull(),
    paymentMethod: paymentMethodEnum("payment_method")
      .notNull()
      .default("polar"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("orders_user_id_idx").on(table.userId),
    index("orders_status_idx").on(table.status),
    index("orders_created_at_idx").on(table.createdAt),
  ],
);

// Currency table to store product currencies within in Rupees and Dollars
export const productCurrencyPrices = pgTable(
  "product_currency_prices",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .references(() => product.productId, { onDelete: "cascade" })
      .notNull(),
    priceAmount: integer("price_amount").notNull(),
    currencyType: currencyEnum("currency_type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("product_currency_prices_product_id_idx").on(table.productId),
    index("product_currency_prices_currency_type_idx").on(table.currencyType),
  ],
);

export const orderProduct = pgTable(
  "order_product",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    productId: integer("product_id")
      .references(() => product.productId, { onDelete: "restrict" })
      .notNull(),
    quantity: integer("quantity").notNull().default(1),
    priceAtOrder: integer("price_at_order").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("order_product_order_id_idx").on(table.orderId),
    index("order_product_product_id_idx").on(table.productId),
  ],
);

// Subscriptions table - tracks Polar subscriptions for users
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: serial("id").primaryKey(),

    // Your internal user reference
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),

    // Polar IDs
    polarCustomerId: varchar("polar_customer_id", { length: 255 }).notNull(),
    polarSubscriptionId: varchar("polar_subscription_id", { length: 255 })
      .notNull()
      .unique(),
    polarProductId: varchar("polar_product_id", { length: 255 }).notNull(),

    // Customer info from Polar
    customerEmail: varchar("customer_email", { length: 255 }).notNull(),
    customerName: varchar("customer_name", { length: 255 }),

    // Subscription details
    status: subscriptionStatusEnum("status").notNull().default("active"),
    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),
    canceledAt: timestamp("canceled_at"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("subscriptions_user_id_idx").on(table.userId),
    index("subscriptions_polar_customer_id_idx").on(table.polarCustomerId),
    index("subscriptions_polar_subscription_id_idx").on(
      table.polarSubscriptionId,
    ),
    index("subscriptions_status_idx").on(table.status),
  ],
);

// Infer insert schemas from schema
export const orderInsertSchema = createInsertSchema(orders);
export const orderSelectSchema = createSelectSchema(orders);
export const orderProductInsertSchema = createInsertSchema(orderProduct);
export const orderProductSelectSchema = createSelectSchema(orderProduct);
export const paymentInsertSchema = createInsertSchema(payments);
export const paymentSelectSchema = createSelectSchema(payments);
export const addressInsertSchema = createInsertSchema(addresses);
export const addressSelectSchema = createSelectSchema(addresses);
export const productCurrencyPriceInsertSchema = createInsertSchema(
  productCurrencyPrices,
);
export const productCurrencyPriceSelectSchema = createSelectSchema(
  productCurrencyPrices,
);

// Infer types from schema
export type TCategory = (typeof categoryEnum.enumValues)[number];
export type TOrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type TOrderProduct = typeof orderProduct.$inferSelect;
export type TOrder = typeof orders.$inferSelect;
export type TProduct = typeof product.$inferSelect;
export type TUser = typeof users.$inferSelect;
export type TPayment = typeof payments.$inferSelect;
export type TAddress = typeof addresses.$inferSelect;
export type TProductCurrencyPrices = typeof productCurrencyPrices.$inferSelect;

// Infer insert types from schema
export type TOrderProductInsert = typeof orderProduct.$inferInsert;
export type TOrderInsert = typeof orders.$inferInsert;
export type TProductInsert = typeof product.$inferInsert;
export type TUserInsert = typeof users.$inferInsert;
export type TPaymentInsert = typeof payments.$inferInsert;
export type TAddressInsert = typeof addresses.$inferInsert;
export type TProductCurrencyPricesInsert =
  typeof productCurrencyPrices.$inferInsert;
