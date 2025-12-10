-- Migration: Add commission_rate column to users table
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/yayykhctnywepnvalivp/sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,4);

-- Optional: Add a comment for documentation
COMMENT ON COLUMN users.commission_rate IS 'Commission rate for the user (e.g., 0.2000 = 20%)';
