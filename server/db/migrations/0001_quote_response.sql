ALTER TABLE "quote_requests" ADD COLUMN "quote_amount_cents" integer;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "response_message" text;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "responded_at" timestamp;