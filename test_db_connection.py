#!/usr/bin/env python3
"""
Simple database connection test
"""

import os
import sys

# Set environment variables for testing
os.environ['DB_HOST'] = 'aws-0-ap-south-1.pooler.supabase.com'
os.environ['DB_USER'] = 'postgres'
os.environ['DB_PASSWORD'] = 'your-actual-password'  # Replace with your actual password
os.environ['DB_NAME'] = 'postgres'
os.environ['DB_PORT'] = '6543'

def test_connection():
    """Test database connection"""
    try:
        from flask_backend_mysql import get_db_connection, execute_query
        
        print("🔍 Testing database connection...")
        
        # Test basic connection
        connection = get_db_connection()
        if not connection:
            print("❌ Failed to get database connection")
            return False
        
        print("✅ Database connection successful")
        
        # Test simple query
        result = execute_query("SELECT 1 as test", fetch_one=True)
        if result:
            print("✅ Simple query works")
        else:
            print("❌ Simple query failed")
            return False
        
        # Test vendors table
        vendors_count = execute_query("SELECT COUNT(*) FROM vendors", fetch_one=True)
        if vendors_count:
            print(f"✅ Vendors table has {vendors_count['count']} records")
        else:
            print("❌ Vendors table query failed")
            return False
        
        # Test users table
        users_count = execute_query("SELECT COUNT(*) FROM users", fetch_one=True)
        if users_count:
            print(f"✅ Users table has {users_count['count']} records")
        else:
            print("❌ Users table query failed")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🧪 Testing database connection and queries...")
    print("=" * 60)
    
    success = test_connection()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ All tests passed! Database is working correctly.")
    else:
        print("❌ Tests failed! Check your Supabase credentials.")
        print("\n🔧 Make sure to:")
        print("1. Replace 'your-actual-password' with your real Supabase password")
        print("2. Use Session Pooler credentials (not direct connection)")
        print("3. Check that your Supabase project is active")
