CREATE TABLE "company_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"file_name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "logo_file" varchar(100);--> statement-breakpoint
ALTER TABLE "company_photos" ADD CONSTRAINT "company_photos_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;