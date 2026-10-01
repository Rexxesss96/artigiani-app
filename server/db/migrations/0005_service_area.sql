ALTER TABLE "companies" ADD COLUMN "emergency_service" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "service_radius_km" smallint DEFAULT 20 NOT NULL;