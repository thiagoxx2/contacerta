-- Migration: Add defaults and triggers for suppliers table
-- This migration adds automatic UUID generation and timestamp management
-- for the suppliers table to avoid 23502 errors when creating records.

-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add defaults for suppliers table
ALTER TABLE "suppliers"
  ALTER COLUMN "id"        SET DEFAULT gen_random_uuid(),
  ALTER COLUMN "createdAt" SET DEFAULT timezone('utc', now()),
  ALTER COLUMN "updatedAt" SET DEFAULT timezone('utc', now());

-- Create function to automatically update updatedAt on row updates
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW."updatedAt" := timezone('utc', now());
  RETURN NEW;
END $$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_suppliers_set_updated_at ON "suppliers";

-- Create trigger to automatically update updatedAt on UPDATE
CREATE TRIGGER trg_suppliers_set_updated_at
  BEFORE UPDATE ON "suppliers"
  FOR EACH ROW 
  EXECUTE FUNCTION set_updated_at();

-- Note: This migration ensures that:
-- 1. New suppliers get a UUID automatically (no need to send id in payload)
-- 2. createdAt is set automatically when inserting (no need to send in payload)
-- 3. updatedAt is set automatically when inserting and updating (no need to send in payload)
-- 4. The application should NOT send id, createdAt, or updatedAt in create/update operations
