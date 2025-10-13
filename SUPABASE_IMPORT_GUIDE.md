
# Supabase Data Import Guide

## Step 1: Run the Complete Schema
1. Go to Supabase SQL Editor
2. Copy and paste the contents of `complete_postgres_schema.sql`
3. Click "Run" to create all tables

## Step 2: Import Your Data
1. Go to Supabase SQL Editor
2. Copy and paste the contents of `supabase_data_import.sql`
3. Click "Run" to import all your data

## Step 3: Verify Data Import
1. Go to Table Editor in Supabase
2. Check each table to ensure data was imported correctly
3. Verify record counts match your original MySQL database

## Step 4: Update Render Environment Variables
Set these in your Render service:
```
DB_HOST=db.your-project.supabase.co
DB_USER=postgres
DB_PASSWORD=your-supabase-password
DB_NAME=postgres
DB_PORT=5432
```

## Troubleshooting:
- If you get foreign key errors, run the schema first
- If you get duplicate key errors, use INSERT ... ON CONFLICT DO NOTHING
- Check that all JSON files are in the same directory as this script
