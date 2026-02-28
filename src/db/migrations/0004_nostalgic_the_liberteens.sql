DROP INDEX "orders_created_at_idx";--> statement-breakpoint
ALTER TABLE "addresses" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "addresses" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products_price" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "products_price" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "order_product" ADD COLUMN "updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "productstable" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "productstable" ADD COLUMN "updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "userstable" ADD COLUMN "updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "products_price" DROP COLUMN "type";