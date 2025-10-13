#!/usr/bin/env python3
"""
Quick Supabase connection test
"""

import os
import pg8000

def test_supabase_connection():
    """Test direct connection to Supabase"""
    
    # Your actual Supabase Session Pooler credentials
    DB_CONFIG = {
        'host': 'aws-1-ap-south-1.pooler.supabase.com',
        'user': 'postgres.chrnpxnqfsvyaidiftjq',
        'password': 'YOUR_ACTUAL_PASSWORD',  # Replace with your real password
        'database': 'postgres',
        'port': 5432
    }
    
    try:
        print("🔍 Testing Supabase connection...")
        print(f"Host: {DB_CONFIG['host']}")
        print(f"Port: {DB_CONFIG['port']}")
        print(f"User: {DB_CONFIG['user']}")
        
        connection = pg8000.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        # Test simple query
        cursor.execute("SELECT 1 as test")
        result = cursor.fetchone()
        
        if result:
            print("✅ Connection successful!")
            
            # Test vendors table
            cursor.execute("SELECT COUNT(*) FROM vendors")
            vendors_count = cursor.fetchone()[0]
            print(f"✅ Vendors table has {vendors_count} records")
            
            # Test users table
            cursor.execute("SELECT COUNT(*) FROM users")
            users_count = cursor.fetchone()[0]
            print(f"✅ Users table has {users_count} records")
            
            cursor.close()
            connection.close()
            return True
        else:
            print("❌ Query failed")
            return False
            
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Supabase Session Pooler connection...")
    print("=" * 60)
    
    success = test_supabase_connection()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ Supabase connection works!")
        print("Copy these credentials to Render environment variables:")
        print("DB_HOST=aws-1-ap-south-1.pooler.supabase.com")
        print("DB_USER=postgres.chrnpxnqfsvyaidiftjq")
        print("DB_PASSWORD=YOUR_ACTUAL_PASSWORD")
        print("DB_NAME=postgres")
        print("DB_PORT=5432")
    else:
        print("❌ Supabase connection failed!")
        print("Please check your credentials and try again.")
