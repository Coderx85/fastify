CREATE TYPE "public"."address_type" AS ENUM('shipping', 'billing');--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"street_address" varchar(255) NOT NULL,
	"street_address2" varchar(255),
	"city" varchar(100),
	"state" varchar(100),
	"postal_code" varchar(20) NOT NULL,
	"country" varchar(100) NOT NULL,
	"address_type" "address_type" NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_currency_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"price_amount" integer NOT NULL,
	"currency_type" "currency" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
UPDATE "orders" SET "payment_method" = 'polar' WHERE "payment_method" IS NULL;--> statement-breakpoint
UPDATE "orders" SET "payment_method" = 'polar' WHERE "payment_method" NOT IN ('polar', 'razorpay');--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "payment_method" SET DATA TYPE "public"."payment_method" USING 
  CASE 
    WHEN "payment_method" IN ('polar', 'razorpay') THEN "payment_method"::"public"."payment_method"
    ELSE 'polar'::"public"."payment_method"
  END;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "payment_method" SET DEFAULT 'polar'::"public"."payment_method";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "payment_method" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "total_amount_currency" "currency" DEFAULT 'usd' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "billing_address_id" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_address_id" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "contact" numeric(10, 0) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_currency_prices" ADD CONSTRAINT "product_currency_prices_product_id_product_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "addresses_user_id_idx" ON "addresses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "product_currency_prices_product_id_idx" ON "product_currency_prices" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_currency_prices_currency_type_idx" ON "product_currency_prices" USING btree ("currency_type");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_billing_address_id_addresses_id_fk" FOREIGN KEY ("billing_address_id") REFERENCES "public"."addresses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_address_id_addresses_id_fk" FOREIGN KEY ("shipping_address_id") REFERENCES "public"."addresses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "shipping_address";