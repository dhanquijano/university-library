CREATE TYPE "public"."leave_status" AS ENUM('pending', 'approved', 'denied');--> statement-breakpoint
CREATE TYPE "public"."leave_type" AS ENUM('vacation', 'sick', 'unpaid', 'other');--> statement-breakpoint
CREATE TYPE "public"."shift_type" AS ENUM('full', 'half', 'split');--> statement-breakpoint
CREATE TABLE "shift_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"break_start" varchar(5),
	"break_end" varchar(5),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "shift_templates_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "staff_leaves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"barber_id" text NOT NULL,
	"type" "leave_type" NOT NULL,
	"date" date NOT NULL,
	"start_time" varchar(5),
	"end_time" varchar(5),
	"status" "leave_status" DEFAULT 'pending' NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "staff_leaves_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "staff_shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"barber_id" text NOT NULL,
	"branch_id" text NOT NULL,
	"date" date NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"breaks" text,
	"type" "shift_type" DEFAULT 'full' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "staff_shifts_id_unique" UNIQUE("id")
);
