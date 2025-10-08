CREATE TABLE "item_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"request_number" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"items" text NOT NULL,
	"total_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"requested_by" text NOT NULL,
	"requested_date" timestamp DEFAULT now(),
	"reviewed_by" text,
	"reviewed_date" timestamp,
	"notes" text,
	"rejection_reason" text,
	"branch" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "item_requests_request_number_unique" UNIQUE("request_number")
);
