CREATE TYPE "public"."availability_status" AS ENUM('AVAILABLE', 'UNAVAILABLE', 'PREFERRED');--> statement-breakpoint
CREATE TYPE "public"."leave_type" AS ENUM('VACATION', 'SICK_LEAVE', 'PERSONAL_LEAVE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."shift_type" AS ENUM('FULL_DAY', 'HALF_DAY_MORNING', 'HALF_DAY_AFTERNOON', 'SPLIT_SHIFT');--> statement-breakpoint
CREATE TABLE "leave_balances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"leave_type" "leave_type" NOT NULL,
	"total_days" integer DEFAULT 0 NOT NULL,
	"used_days" integer DEFAULT 0 NOT NULL,
	"remaining_days" integer DEFAULT 0 NOT NULL,
	"year" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "leave_balances_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "shift_change_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"current_shift_id" uuid NOT NULL,
	"requested_shift_id" uuid,
	"requested_date" date,
	"requested_start_time" varchar(5),
	"requested_end_time" varchar(5),
	"reason" text NOT NULL,
	"status" "request_status" DEFAULT 'PENDING',
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "shift_change_requests_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "shift_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"branch" varchar(100) NOT NULL,
	"shift_date" date NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"break_start" varchar(5),
	"break_end" varchar(5),
	"shift_type" "shift_type" NOT NULL,
	"template_id" uuid,
	"is_published" boolean DEFAULT false,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "shift_schedules_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "staff_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"is_read" boolean DEFAULT false,
	"related_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "staff_notifications_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "time_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"shift_id" uuid NOT NULL,
	"clock_in" timestamp with time zone,
	"clock_out" timestamp with time zone,
	"total_hours" numeric(4, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "time_tracking_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "shifts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "time_punches" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "shifts" CASCADE;--> statement-breakpoint
DROP TABLE "time_punches" CASCADE;--> statement-breakpoint
ALTER TABLE "leave_requests" DROP CONSTRAINT "leave_requests_barber_id_barbers_id_fk";
--> statement-breakpoint
ALTER TABLE "leave_requests" DROP CONSTRAINT "leave_requests_branch_id_inventory_branches_id_fk";
--> statement-breakpoint
ALTER TABLE "staff_availability" DROP CONSTRAINT "staff_availability_barber_id_barbers_id_fk";
--> statement-breakpoint
ALTER TABLE "staff_availability" DROP CONSTRAINT "staff_availability_branch_id_inventory_branches_id_fk";
--> statement-breakpoint
ALTER TABLE "leave_requests" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "leave_requests" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "leave_requests" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "leave_requests" ALTER COLUMN "status" SET DATA TYPE "public"."request_status" USING "status"::text::"public"."request_status";--> statement-breakpoint
ALTER TABLE "leave_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING';--> statement-breakpoint
ALTER TABLE "leave_requests" ALTER COLUMN "status" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_requests" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leave_requests" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "shift_templates" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "shift_templates" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "shift_templates" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "shift_templates" ALTER COLUMN "start_time" SET DATA TYPE varchar(5);--> statement-breakpoint
ALTER TABLE "shift_templates" ALTER COLUMN "end_time" SET DATA TYPE varchar(5);--> statement-breakpoint
ALTER TABLE "shift_templates" ALTER COLUMN "role" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "shift_templates" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "shift_templates" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "shift_templates" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "shift_templates" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "staff_availability" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "staff_availability" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "staff_availability" ALTER COLUMN "start_time" SET DATA TYPE varchar(5);--> statement-breakpoint
ALTER TABLE "staff_availability" ALTER COLUMN "start_time" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "staff_availability" ALTER COLUMN "end_time" SET DATA TYPE varchar(5);--> statement-breakpoint
ALTER TABLE "staff_availability" ALTER COLUMN "end_time" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "staff_availability" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "staff_availability" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "leave_type" "leave_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "reason" text NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "reviewed_by" uuid;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "review_notes" text;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "shift_templates" ADD COLUMN "break_start" varchar(5);--> statement-breakpoint
ALTER TABLE "shift_templates" ADD COLUMN "break_end" varchar(5);--> statement-breakpoint
ALTER TABLE "shift_templates" ADD COLUMN "shift_type" "shift_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "shift_templates" ADD COLUMN "experience" varchar(100);--> statement-breakpoint
ALTER TABLE "shift_templates" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "staff_availability" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "staff_availability" ADD COLUMN "status" "availability_status" DEFAULT 'AVAILABLE';--> statement-breakpoint
ALTER TABLE "staff_availability" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_change_requests" ADD CONSTRAINT "shift_change_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_change_requests" ADD CONSTRAINT "shift_change_requests_current_shift_id_shift_schedules_id_fk" FOREIGN KEY ("current_shift_id") REFERENCES "public"."shift_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_change_requests" ADD CONSTRAINT "shift_change_requests_requested_shift_id_shift_schedules_id_fk" FOREIGN KEY ("requested_shift_id") REFERENCES "public"."shift_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_change_requests" ADD CONSTRAINT "shift_change_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_schedules" ADD CONSTRAINT "shift_schedules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_schedules" ADD CONSTRAINT "shift_schedules_template_id_shift_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."shift_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_schedules" ADD CONSTRAINT "shift_schedules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_notifications" ADD CONSTRAINT "staff_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_tracking" ADD CONSTRAINT "time_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_tracking" ADD CONSTRAINT "time_tracking_shift_id_shift_schedules_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shift_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_availability" ADD CONSTRAINT "staff_availability_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" DROP COLUMN "barber_id";--> statement-breakpoint
ALTER TABLE "leave_requests" DROP COLUMN "branch_id";--> statement-breakpoint
ALTER TABLE "leave_requests" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "leave_requests" DROP COLUMN "notes";--> statement-breakpoint
ALTER TABLE "leave_requests" DROP COLUMN "decided_at";--> statement-breakpoint
ALTER TABLE "shift_templates" DROP COLUMN "breaks";--> statement-breakpoint
ALTER TABLE "staff_availability" DROP COLUMN "barber_id";--> statement-breakpoint
ALTER TABLE "staff_availability" DROP COLUMN "branch_id";--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_id_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "shift_templates" ADD CONSTRAINT "shift_templates_id_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "staff_availability" ADD CONSTRAINT "staff_availability_id_unique" UNIQUE("id");