CREATE TYPE "public"."job_budget" AS ENUM('under_200', '200_1000', '1000_5000', 'over_5000', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."job_size" AS ENUM('small', 'large');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('open', 'assigned', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."job_urgency" AS ENUM('urgent', 'week', 'flexible');--> statement-breakpoint
ALTER TYPE "public"."request_status" ADD VALUE 'quoted';--> statement-breakpoint
ALTER TYPE "public"."request_status" ADD VALUE 'not_selected';--> statement-breakpoint
CREATE TABLE "job_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"file_name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"category_id" integer NOT NULL,
	"title" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"city" varchar(60) NOT NULL,
	"address" varchar(100),
	"urgency" "job_urgency" NOT NULL,
	"size" "job_size" NOT NULL,
	"budget" "job_budget" DEFAULT 'unknown' NOT NULL,
	"status" "job_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "quote_requests" ALTER COLUMN "message" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "job_id" integer;--> statement-breakpoint
ALTER TABLE "job_photos" ADD CONSTRAINT "job_photos_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;