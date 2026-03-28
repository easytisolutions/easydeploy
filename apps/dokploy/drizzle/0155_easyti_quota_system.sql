-- EasyTI Cloud: add quota/plan fields to organization table
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "plan" text NOT NULL DEFAULT 'free';
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "plan_expires_at" timestamp;
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "max_projects" integer NOT NULL DEFAULT 3;
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "max_services" integer NOT NULL DEFAULT 10;
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "max_databases" integer NOT NULL DEFAULT 5;
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "max_storage_gb" integer NOT NULL DEFAULT 10;
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "max_bandwidth_gb" integer NOT NULL DEFAULT 100;
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "current_projects" integer NOT NULL DEFAULT 0;
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "current_services" integer NOT NULL DEFAULT 0;
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "current_databases" integer NOT NULL DEFAULT 0;
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "custom_limits" jsonb;
