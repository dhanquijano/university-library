CREATE TABLE "barbers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"specialties" text NOT NULL,
	"experience" text NOT NULL,
	"rating" numeric(3, 1) NOT NULL,
	"image" text,
	"branches" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
