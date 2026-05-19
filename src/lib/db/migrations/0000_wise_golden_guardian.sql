CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"receipt_id" uuid,
	"action" text NOT NULL,
	"field_changed" text,
	"old_value" text,
	"new_value" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category" text NOT NULL,
	"monthly_limit" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text DEFAULT 'uploading' NOT NULL,
	"merchant" text,
	"merchant_abn" text,
	"receipt_date" timestamp,
	"total_amount" numeric(10, 2),
	"gst_amount" numeric(10, 2),
	"subtotal_amount" numeric(10, 2),
	"currency" text DEFAULT 'AUD',
	"payment_method" text,
	"receipt_type" text,
	"category" text,
	"subcategory" text,
	"tags" text[],
	"tax_claimable" boolean,
	"tax_claimable_confidence" numeric(5, 2),
	"tax_claimable_reasoning" text,
	"tax_category" text,
	"business_percentage" integer DEFAULT 0,
	"line_items" jsonb,
	"ocr_raw_text" text,
	"ai_extraction_raw" jsonb,
	"original_blob_url" text,
	"compressed_blob_url" text,
	"odometer_reading" integer,
	"fuel_litres" numeric(8, 3),
	"fuel_type" text,
	"reimbursable" boolean DEFAULT false,
	"reimbursement_status" text,
	"reimbursement_source" text,
	"reimbursement_submitted_at" timestamp,
	"reimbursement_received_at" timestamp,
	"reimbursement_amount" numeric(10, 2),
	"notes" text,
	"is_duplicate" boolean DEFAULT false,
	"source" text DEFAULT 'upload',
	"vehicle_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"display_name" text,
	"tax_profile" jsonb,
	"subscription_tier" text DEFAULT 'free',
	"stripe_customer_id" text,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE "vehicle_fuel_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"receipt_id" uuid,
	"litres" numeric(8, 3),
	"odometer_reading" integer,
	"fuel_type" text,
	"cost_per_litre" numeric(8, 3),
	"total_cost" numeric(10, 2),
	"logged_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"make" text,
	"model" text,
	"year" integer,
	"rego" text,
	"fuel_type" text DEFAULT 'petrol',
	"business_use_percent" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_receipt_id_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_fuel_logs" ADD CONSTRAINT "vehicle_fuel_logs_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_fuel_logs" ADD CONSTRAINT "vehicle_fuel_logs_receipt_id_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "budgets_user_category_idx" ON "budgets" USING btree ("user_id","category");--> statement-breakpoint
CREATE INDEX "receipts_user_date_idx" ON "receipts" USING btree ("user_id","receipt_date");--> statement-breakpoint
CREATE INDEX "receipts_user_merchant_idx" ON "receipts" USING btree ("user_id","merchant");--> statement-breakpoint
CREATE INDEX "receipts_user_category_idx" ON "receipts" USING btree ("user_id","category");--> statement-breakpoint
CREATE INDEX "receipts_user_status_idx" ON "receipts" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "user_profiles_clerk_user_id_idx" ON "user_profiles" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "vehicle_fuel_logs_vehicle_idx" ON "vehicle_fuel_logs" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "vehicles_user_idx" ON "vehicles" USING btree ("user_id");