#!/usr/bin/env python3
"""
Test script to check database content and queries
"""

import os
import sys

# Add the current directory to Python path so we can import the Flask app
sys.path.append('.')

def test_vendors_table():
    """Test the vendors table content"""
    try:
        from flask_backend_mysql import execute_query
        
        # Test basic connection
        print("🔍 Testing database connection...")
        test_result = execute_query("SELECT 1 as test", fetch_one=True)
        if not test_result:
            print("❌ Database connection failed")
            return False
        
        print("✅ Database connection successful")
        
        # Check vendors table structure
        print("\n🔍 Checking vendors table...")
        vendors_count = execute_query("SELECT COUNT(*) FROM vendors", fetch_one=True)
        if vendors_count:
            print(f"✅ Vendors table has {vendors_count['count']} records")
        else:
            print("❌ Vendors table query failed")
            return False
        
        # Check nda_status values
        print("\n🔍 Checking nda_status values...")
        nda_status_query = "SELECT DISTINCT nda_status FROM vendors WHERE nda_status IS NOT NULL"
        nda_statuses = execute_query(nda_status_query, fetch_all=True)
        if nda_statuses:
            print(f"✅ Found nda_status values: {[status['nda_status'] for status in nda_statuses]}")
        else:
            print("❌ No nda_status values found")
        
        # Test the notifications query
        print("\n🔍 Testing notifications query...")
        notifications_query = """
        SELECT 
            'vendor_nda_submitted' as type,
            ('NDA Submitted by ' || company_name) as title,
            ('New NDA form submitted by ' || company_name || ' (' || contact_person || ')') as message,
            created_at,
            id as reference_id
        FROM vendors 
        WHERE nda_status = 'completed' 
        AND created_at >= NOW() - INTERVAL '30 days'
        LIMIT 5
        """
        
        notifications = execute_query(notifications_query, fetch_all=True)
        if notifications is not None:
            print(f"✅ Notifications query returned {len(notifications)} results")
            if notifications:
                print("Sample notification:", notifications[0])
        else:
            print("❌ Notifications query returned None")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🧪 Testing database content and queries...")
    print("=" * 60)
    
    success = test_vendors_table()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ Database testing completed successfully!")
    else:
        print("❌ Database testing failed!")
        print("\n🔧 Troubleshooting steps:")
        print("1. Check if Supabase credentials are correct in Render")
        print("2. Verify that all tables were created successfully")
        print("3. Check if data was imported correctly")
        print("4. Look at the error messages above for specific issues")
