#!/usr/bin/env python3
"""
Import MySQL data to Supabase PostgreSQL
This script imports all your exported JSON data into Supabase with proper structure matching
"""

import json
import os
from datetime import datetime

def import_data_to_supabase():
    """Import all exported JSON data to Supabase"""
    print("🚀 Starting MySQL to Supabase Data Import")
    print("=" * 60)
    
    # Get all JSON files
    json_files = [f for f in os.listdir('.') if f.startswith('export_') and f.endswith('.json')]
    
    if not json_files:
        print("❌ No exported JSON files found!")
        print("Please run the export script first: python export_mysql_data.py")
        return False
    
    print(f"📊 Found {len(json_files)} tables to import")
    
    # Create SQL import statements
    sql_statements = []
    
    for json_file in json_files:
        table_name = json_file.replace('export_', '').replace('.json', '')
        
        try:
            with open(json_file, 'r') as f:
                data = json.load(f)
            
            if not data:
                print(f"⏭️ Skipping {table_name} (no data)")
                continue
            
            print(f"📊 Processing {len(data)} rows for {table_name}")
            
            # Generate INSERT statements
            for record in data:
                sql = generate_insert_sql(table_name, record)
                if sql:
                    sql_statements.append(sql)
            
            print(f"✅ Generated {len(data)} INSERT statements for {table_name}")
            
        except Exception as e:
            print(f"❌ Error processing {table_name}: {e}")
    
    # Save all SQL statements to file
    sql_file = "supabase_data_import.sql"
    with open(sql_file, 'w', encoding='utf-8') as f:
        f.write("-- Supabase Data Import SQL\n")
        f.write("-- Generated from MySQL export\n")
        f.write(f"-- Generated on: {datetime.now().isoformat()}\n\n")
        
        for sql in sql_statements:
            f.write(sql + "\n")
    
    print(f"\n🎉 Import SQL generated!")
    print(f"📁 File created: {sql_file}")
    print(f"📊 Total INSERT statements: {len(sql_statements)}")
    
    return True

def generate_insert_sql(table_name, record):
    """Generate INSERT SQL statement for a record"""
    if not record:
        return None
    
    # Get column names and values
    columns = list(record.keys())
    values = []
    
    for col in columns:
        value = record.get(col)
        
        # Handle different data types
        if value is None:
            values.append('NULL')
        elif isinstance(value, str):
            # Escape single quotes
            escaped_value = value.replace("'", "''")
            values.append(f"'{escaped_value}'")
        elif isinstance(value, bool):
            values.append('TRUE' if value else 'FALSE')
        elif isinstance(value, (int, float)):
            values.append(str(value))
        else:
            # Convert to string and escape
            escaped_value = str(value).replace("'", "''")
            values.append(f"'{escaped_value}'")
    
    # Generate INSERT statement
    columns_str = ', '.join(columns)
    values_str = ', '.join(values)
    
    sql = f"INSERT INTO {table_name} ({columns_str}) VALUES ({values_str});"
    return sql

def create_supabase_import_guide():
    """Create a guide for importing data to Supabase"""
    guide = """
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
"""
    
    with open("SUPABASE_IMPORT_GUIDE.md", 'w', encoding='utf-8') as f:
        f.write(guide)
    
    print("📋 Import guide created: SUPABASE_IMPORT_GUIDE.md")

def main():
    print("🔄 Starting MySQL to Supabase Migration")
    print("=" * 60)
    
    # Import data
    success = import_data_to_supabase()
    
    if success:
        # Create import guide
        create_supabase_import_guide()
        
        print("\n" + "=" * 60)
        print("📋 NEXT STEPS:")
        print("1. ✅ Data import SQL generated")
        print("2. ✅ Import guide created")
        print("3. 🔄 Run complete_postgres_schema.sql in Supabase")
        print("4. 🔄 Run supabase_data_import.sql in Supabase")
        print("5. 🔄 Update Render environment variables")
        print("=" * 60)
        
        print("\n📁 Files created:")
        print("- supabase_data_import.sql (all your data)")
        print("- SUPABASE_IMPORT_GUIDE.md (step-by-step guide)")
        print("- complete_postgres_schema.sql (table structure)")
    
    else:
        print("❌ Import failed. Please check your exported JSON files.")

if __name__ == "__main__":
    main()
