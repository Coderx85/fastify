ALTER TABLE "subscriptions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "subscriptions" CASCADE;--> statement-breakpoint
ALTER TABLE "product_currency_prices" RENAME TO "products_price";--> statement-breakpoint
ALTER TABLE "product" RENAME TO "productstable";--> statement-breakpoint
ALTER TABLE "users" RENAME TO "userstable";--> statement-breakpoint
ALTER TABLE "userstable" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "addresses" DROP CONSTRAINT "addresses_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "order_product" DROP CONSTRAINT "order_product_product_id_product_product_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "products_price" DROP CONSTRAINT "product_currency_prices_product_id_product_product_id_fk";
--> statement-breakpoint
ALTER TABLE "products_price" ADD COLUMN "type" "currency" DEFAULT 'inr' NOT NULL;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_userstable_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."userstable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_product" ADD CONSTRAINT "order_product_product_id_productstable_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."productstable"("product_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_userstable_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."userstable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products_price" ADD CONSTRAINT "products_price_product_id_productstable_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."productstable"("product_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productstable" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "productstable" DROP COLUMN "price";--> statement-breakpoint
ALTER TABLE "userstable" ADD CONSTRAINT "userstable_email_unique" UNIQUE("email");