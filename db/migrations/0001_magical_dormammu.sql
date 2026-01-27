ALTER TYPE "public"."user_role" ADD VALUE 'buyer' BEFORE 'admin';--> statement-breakpoint
ALTER TYPE "public"."request_status" ADD VALUE 'purchased';--> statement-breakpoint
ALTER TABLE "travel_requests" ADD COLUMN "justification" text;--> statement-breakpoint
ALTER TABLE "travel_requests" ADD COLUMN "cost_center" text NOT NULL;--> statement-breakpoint
ALTER TABLE "travel_requests" ADD COLUMN "parent_request_id" uuid;--> statement-breakpoint
ALTER TABLE "travel_requests" ADD COLUMN "purchase_confirmation_codes" jsonb;--> statement-breakpoint
ALTER TABLE "travel_requests" ADD COLUMN "buyer_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password" text NOT NULL;--> statement-breakpoint
ALTER TABLE "travel_requests" ADD CONSTRAINT "travel_requests_parent_request_id_travel_requests_id_fk" FOREIGN KEY ("parent_request_id") REFERENCES "public"."travel_requests"("id") ON DELETE no action ON UPDATE no action;