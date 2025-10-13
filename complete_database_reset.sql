-- Complete Database Reset for Supabase
-- This will drop all tables and recreate them with the perfect schema
-- Run this in Supabase SQL Editor

-- Drop all existing tables
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Grant permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Now run the perfect schema
-- Copy and paste the entire contents of perfect_postgres_schema.sql here
-- Then run the data import from supabase_data_import.sql
