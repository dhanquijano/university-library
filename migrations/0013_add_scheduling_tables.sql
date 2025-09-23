-- Add scheduling tables
CREATE TYPE "shift_type" AS ENUM('full', 'half', 'split');
CREATE TYPE "leave_type" AS ENUM('vacation', 'sick', 'unpaid', 'other');
CREATE TYPE "leave_status" AS ENUM('pending', 'approved', 'denied');

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

-- Insert default templates
INSERT INTO "shift_templates" ("id", "name", "start_time", "end_time", "break_start", "break_end") VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Full Day (10-10)', '10:00', '22:00', '13:00', '14:00'),
('550e8400-e29b-41d4-a716-446655440002', 'Half Day (12-5)', '12:00', '17:00', NULL, NULL);
