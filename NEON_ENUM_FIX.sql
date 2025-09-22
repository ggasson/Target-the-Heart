-- This SQL script fixes the prayer_category enum issue in the Neon database
-- Run this directly in your Neon database console

-- Step 1: Check current enum values
SELECT enumlabel as enum_value, enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e on t.oid = e.enumtypid  
WHERE t.typname = 'prayer_category'
ORDER BY e.enumsortorder;

-- Step 2: Check if any prayer requests exist
SELECT COUNT(*) as prayer_count FROM prayer_requests;

-- Step 3: Safely recreate the enum (only if no prayer requests exist)
BEGIN;

-- Convert column to text temporarily
ALTER TABLE prayer_requests ALTER COLUMN category TYPE text;

-- Drop the old enum (will cascade to column default)
DROP TYPE IF EXISTS prayer_category CASCADE;

-- Create new enum with exact values
CREATE TYPE prayer_category AS ENUM (
  'health_healing',
  'family_relationships',
  'work_career',
  'spiritual_growth',
  'financial_provision',
  'other'
);

-- Convert column back to enum type
ALTER TABLE prayer_requests 
ALTER COLUMN category 
TYPE prayer_category 
USING category::prayer_category;

-- Set default value
ALTER TABLE prayer_requests 
ALTER COLUMN category 
SET DEFAULT 'other'::prayer_category;

-- Test the enum works
SELECT 'health_healing'::prayer_category as test_value;

COMMIT;

-- Verify the fix
SELECT 'Enum fix completed successfully' as status;
