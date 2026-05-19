-- Create vehicles table
CREATE TABLE IF NOT EXISTS "vehicles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "user_profiles"("id") ON DELETE CASCADE,
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

-- Create index on vehicles user_id
CREATE INDEX IF NOT EXISTS "vehicles_user_idx" ON "vehicles" ("user_id");

-- Create vehicle_fuel_logs table
CREATE TABLE IF NOT EXISTS "vehicle_fuel_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "vehicle_id" uuid NOT NULL REFERENCES "vehicles"("id") ON DELETE CASCADE,
  "receipt_id" uuid REFERENCES "receipts"("id") ON DELETE SET NULL,
  "litres" numeric(8, 3),
  "odometer_reading" integer,
  "fuel_type" text,
  "cost_per_litre" numeric(8, 3),
  "total_cost" numeric(10, 2),
  "logged_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create index on vehicle_fuel_logs vehicle_id
CREATE INDEX IF NOT EXISTS "vehicle_fuel_logs_vehicle_idx" ON "vehicle_fuel_logs" ("vehicle_id");

-- Add vehicle_id to receipts table
ALTER TABLE "receipts" ADD COLUMN IF NOT EXISTS "vehicle_id" uuid REFERENCES "vehicles"("id") ON DELETE SET NULL;
