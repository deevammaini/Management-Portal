#!/usr/bin/env python3
"""
Script to help set up the Supabase database
"""

import os
from flask_backend_mysql import execute_query

def test_database_connection():
    """Test if we can connect to the database"""
    try:
        result = execute_query("SELECT 1 as test", fetch_one=True)
        if result:
            print("✅ Database connection successful!")
            return True
        else:
            print("❌ Database connection failed - no result")
            return False
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return False

def check_tables_exist():
    """Check if the required tables exist"""
    tables_to_check = [
        'users', 'admins', 'vendors', 'nda_requests', 
        'tasks', 'projects', 'workflows', 'tickets',
        'announcements', 'attendance'
    ]
    
    existing_tables = []
    missing_tables = []
    
    for table in tables_to_check:
        try:
            result = execute_query(f"SELECT COUNT(*) FROM {table}", fetch_one=True)
            if result is not None:
                existing_tables.append(table)
                print(f"✅ Table '{table}' exists")
            else:
                missing_tables.append(table)
                print(f"❌ Table '{table}' missing")
        except Exception as e:
            missing_tables.append(table)
            print(f"❌ Table '{table}' error: {e}")
    
    print(f"\n📊 Summary:")
    print(f"✅ Existing tables: {len(existing_tables)}")
    print(f"❌ Missing tables: {len(missing_tables)}")
    
    if missing_tables:
        print(f"\n🔧 Missing tables: {', '.join(missing_tables)}")
        print("\n📝 Next steps:")
        print("1. Go to Supabase SQL Editor")
        print("2. Copy and run the contents of 'corrected_postgres_schema.sql'")
        print("3. Copy and run the contents of 'supabase_data_import.sql'")
    
    return len(missing_tables) == 0

def main():
    print("🔍 Checking database setup...")
    print("=" * 50)
    
    # Test connection
    if not test_database_connection():
        print("\n❌ Cannot proceed - database connection failed")
        print("Please check your Supabase credentials in Render environment variables")
        return
    
    print("\n" + "=" * 50)
    print("🔍 Checking tables...")
    
    # Check tables
    if check_tables_exist():
        print("\n🎉 Database setup is complete!")
        print("All required tables exist and the application should work properly.")
    else:
        print("\n⚠️  Database setup incomplete")
        print("Please follow the steps above to create the missing tables.")

if __name__ == "__main__":
    main()
