-- Add missing fields to super_admin table
ALTER TABLE "super_admin" ADD COLUMN IF NOT EXISTS "permissions" jsonb DEFAULT '[]';
ALTER TABLE "super_admin" ADD COLUMN IF NOT EXISTS "last_login" timestamp;
ALTER TABLE "super_admin" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;

-- Add missing fields to school_admin table
ALTER TABLE "school_admin" ADD COLUMN IF NOT EXISTS "is_verified" boolean DEFAULT false;
ALTER TABLE "school_admin" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;
ALTER TABLE "school_admin" ADD COLUMN IF NOT EXISTS "last_login" timestamp;
ALTER TABLE "school_admin" ADD COLUMN IF NOT EXISTS "contact_number" text;

-- Update schema.js to match
ALTER TABLE "school_admin" RENAME COLUMN "phone" TO "contact_number";

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS "super_admin_email_idx" ON "super_admin" ("email");
CREATE INDEX IF NOT EXISTS "school_admin_email_idx" ON "school_admin" ("email");
CREATE INDEX IF NOT EXISTS "school_admin_school_id_idx" ON "school_admin" ("school_id"); 