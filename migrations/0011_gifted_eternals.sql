ALTER TYPE "public"."role" ADD VALUE 'MANAGER';--> statement-breakpoint
ALTER TYPE "public"."role" ADD VALUE 'STAFF';--> statement-breakpoint
DROP TABLE "leave_balances" CASCADE;--> statement-breakpoint
DROP TABLE "leave_requests" CASCADE;--> statement-breakpoint
DROP TABLE "shift_change_requests" CASCADE;--> statement-breakpoint
DROP TABLE "shift_schedules" CASCADE;--> statement-breakpoint
DROP TABLE "shift_templates" CASCADE;--> statement-breakpoint
DROP TABLE "staff_availability" CASCADE;--> statement-breakpoint
DROP TABLE "staff_notifications" CASCADE;--> statement-breakpoint
DROP TABLE "time_tracking" CASCADE;--> statement-breakpoint
DROP TYPE "public"."availability_status";--> statement-breakpoint
DROP TYPE "public"."leave_type";--> statement-breakpoint
DROP TYPE "public"."request_status";--> statement-breakpoint
DROP TYPE "public"."shift_type";