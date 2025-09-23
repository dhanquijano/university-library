ALTER TABLE "purchase_orders" ALTER COLUMN "requested_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "stock_transactions" ALTER COLUMN "user_id" SET DATA TYPE uuid;