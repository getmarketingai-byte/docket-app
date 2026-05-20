-- Create share_links table for accountant portal
CREATE TABLE IF NOT EXISTS "share_links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "user_profiles"("id") ON DELETE CASCADE,
  "token" text NOT NULL UNIQUE,
  "label" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "expires_at" timestamp,
  "view_count" integer NOT NULL DEFAULT 0,
  "last_viewed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "share_links_token_idx" ON "share_links" ("token");
CREATE INDEX IF NOT EXISTS "share_links_user_idx" ON "share_links" ("user_id");

-- Add duplicate_of_id FK (was added in code but migration was missing)
ALTER TABLE "receipts" ADD COLUMN IF NOT EXISTS "duplicate_of_id" uuid REFERENCES "receipts"("id") ON DELETE SET NULL;
