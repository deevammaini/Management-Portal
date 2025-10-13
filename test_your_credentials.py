#!/usr/bin/env python3
"""
Test your exact Supabase credentials
"""

import pg8000

def test_your_credentials():
    """Test your exact Supabase credentials"""
    
    # Your exact credentials from the connection string
    DB_CONFIG = {
        'host': 'aws-1-ap-south-1.pooler.supabase.com',
        'user': 'postgres.chrnpxnqfsvyaidiftjq',
        'password': 'YOUR_REAL_PASSWORD_HERE',  # Replace this!
        'database': 'postgres',
        'port': 5432
    }
    
    print("🧪 Testing your exact Supabase credentials...")
    print("=" * 60)
    print(f"Host: {DB_CONFIG['host']}")
    print(f"Port: {DB_CONFIG['port']}")
    print(f"User: {DB_CONFIG['user']}")
    print(f"Database: {DB_CONFIG['database']}")
    print("=" * 60)
    
    try:
        print("🔍 Attempting connection...")
        connection = pg8000.connect(**DB_CONFIG)
        print("✅ Connection successful!")
        
        cursor = connection.cursor()
        
        # Test simple query
        cursor.execute("SELECT 1 as test")
        result = cursor.fetchone()
        print(f"✅ Simple query result: {result}")
        
        # Test vendors table
        cursor.execute("SELECT COUNT(*) FROM vendors")
        vendors_count = cursor.fetchone()[0]
        print(f"✅ Vendors count: {vendors_count}")
        
        # Test users table
        cursor.execute("SELECT COUNT(*) FROM users")
        users_count = cursor.fetchone()[0]
        print(f"✅ Users count: {users_count}")
        
        cursor.close()
        connection.close()
        
        print("\n🎉 SUCCESS! Your credentials work!")
        print("\n📋 Copy these to Render environment variables:")
        print("DB_HOST=aws-1-ap-south-1.pooler.supabase.com")
        print("DB_USER=postgres.chrnpxnqfsvyaidiftjq")
        print(f"DB_PASSWORD={DB_CONFIG['password']}")
        print("DB_NAME=postgres")
        print("DB_PORT=5432")
        
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("\n🔧 Troubleshooting:")
        print("1. Make sure you replaced 'YOUR_REAL_PASSWORD_HERE' with your actual password")
        print("2. Check that your Supabase project is active")
        print("3. Verify you're using Session Pooler credentials (not direct connection)")
        return False

if __name__ == "__main__":
    print("🔐 Supabase Credential Test")
    print("⚠️  IMPORTANT: Replace 'YOUR_REAL_PASSWORD_HERE' with your actual password!")
    print()
    
    success = test_your_credentials()
    
    if not success:
        print("\n❌ Test failed. Please check your password and try again.")
