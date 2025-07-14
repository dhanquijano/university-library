CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"mobile_number" varchar(20) NOT NULL,
	"appointment_date" date NOT NULL,
	"appointment_time" varchar(10) NOT NULL,
	"branch" varchar(100) NOT NULL,
	"barber" varchar(100) NOT NULL,
	"services" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "appointments_id_unique" UNIQUE("id"),
	CONSTRAINT "appointments_email_unique" UNIQUE("email")
);
