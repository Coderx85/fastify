import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  pgEnum,
  index,
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

export const orderStatusEnum = pgEnum("order_status", [
  "processing",
  "delivered",
  "cancelled",
]);

/**
 * User table
 *
 * @property id - User id
 * @property name - User name
 * @property email - User email
 * @property password - User password
 * @property createdAt - User created at
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Product table
 *
 * @property id - Product id
 * @property productId - Product id
 * @property name - Product name
 * @property description - Product description
 * @property price - Product price
 * @property category - Product category
 */
export const product = pgTable(
  "product",
  {
    id: serial("id"),
    productId: serial("product_id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    price: integer("price").notNull(),
    category: categoryEnum("category").notNull(),
  },
  (table) => [
    index("index").on(table.name),
    index("product_id_index_column").on(table.productId),
  ],
);

/**
 * Order table
 *
 * @property id - Order id
 * @property userId - User id
 * @property totalAmount - Total order amount in cents
 * @property status - Order status
 * @property shippingAddress - Shipping address
 * @property paymentMethod - Payment method used
 * @property notes - Additional order notes
 * @property createdAt - Order created at
 * @property updatedAt - Order updated at
 */
export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    totalAmount: integer("total_amount").notNull().default(0),
    status: orderStatusEnum("status").notNull().default("processing"),
    shippingAddress: text("shipping_address"),
    paymentMethod: varchar("payment_method", { length: 50 }),
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

/**
 * Order product table (junction table for many-to-many relationship)
 *
 * @property id - Order product id
 * @property orderId - Order id
 * @property productId - Product id
 * @property quantity - Product quantity
 * @property priceAtOrder - Price per unit at time of order (in cents)
 * @property createdAt - Record created at
 */
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

// Infer insert schemas from schema
export const orderInsertSchema = createInsertSchema(orders);
export const orderSelectSchema = createSelectSchema(orders);
export const orderProductInsertSchema = createInsertSchema(orderProduct);
export const orderProductSelectSchema = createSelectSchema(orderProduct);

// Infer types from schema
export type TCategory = (typeof categoryEnum.enumValues)[number];
export type TOrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type TOrderProduct = typeof orderProduct.$inferSelect;
export type TOrder = typeof orders.$inferSelect;
export type TProduct = typeof product.$inferSelect;
export type TUser = typeof users.$inferSelect;

// Infer insert types from schema
export type TOrderProductInsert = typeof orderProduct.$inferInsert;
export type TOrderInsert = typeof orders.$inferInsert;
export type TProductInsert = typeof product.$inferInsert;
export type TUserInsert = typeof users.$inferInsert;
