#!/usr/bin/env python3
"""
MySQL to PostgreSQL Migration Script
This script will help migrate your data from MySQL to PostgreSQL
"""

import mysql.connector
import psycopg2
import os
from datetime import datetime

# MySQL connection (your local database)
mysql_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'deevammaini',
    'database': 'vendor_management'
}

# PostgreSQL connection (you'll get this from Render)
postgres_config = {
    'host': 'your-postgres-host',
    'user': 'your-postgres-user',
    'password': 'your-postgres-password',
    'database': 'your-postgres-db',
    'port': 5432
}

def export_mysql_data():
    """Export data from MySQL"""
    print("🔄 Exporting data from MySQL...")
    
    try:
        # Connect to MySQL
        mysql_conn = mysql.connector.connect(**mysql_config)
        mysql_cursor = mysql_conn.cursor(dictionary=True)
        
        # Get all tables
        mysql_cursor.execute("SHOW TABLES")
        tables = [row[f'Tables_in_{mysql_config["database"]}'] for row in mysql_cursor.fetchall()]
        
        exported_data = {}
        
        for table in tables:
            print(f"📊 Exporting table: {table}")
            mysql_cursor.execute(f"SELECT * FROM {table}")
            exported_data[table] = mysql_cursor.fetchall()
            print(f"✅ Exported {len(exported_data[table])} rows from {table}")
        
        mysql_conn.close()
        return exported_data
        
    except Exception as e:
        print(f"❌ Error exporting from MySQL: {e}")
        return None

def create_postgres_schema():
    """Create PostgreSQL schema based on MySQL structure"""
    print("🏗️ Creating PostgreSQL schema...")
    
    # This will be your PostgreSQL schema
    schema_sql = """
    -- PostgreSQL Schema for YellowStone Management System
    
    -- Create admins table
    CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Create departments table
    CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Create users table
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        employee_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        designation VARCHAR(255),
        department VARCHAR(255),
        manager VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Create vendors table
    CREATE TABLE IF NOT EXISTS vendors (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        company_name VARCHAR(200),
        contact_person VARCHAR(100),
        phone VARCHAR(20),
        address TEXT,
        nda_status VARCHAR(50) DEFAULT 'pending',
        portal_access BOOLEAN DEFAULT FALSE,
        reference_number VARCHAR(20) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        company_registration_number VARCHAR(100),
        company_incorporation_country VARCHAR(100),
        company_incorporation_state VARCHAR(100),
        signature_type VARCHAR(50),
        signature_data TEXT,
        company_stamp_data TEXT,
        signed_date TIMESTAMP,
        registration_status VARCHAR(50) DEFAULT 'pending'
    );
    
    -- Add more tables as needed...
    """
    
    return schema_sql

def main():
    print("🚀 Starting MySQL to PostgreSQL Migration")
    print("=" * 50)
    
    # Step 1: Export data from MySQL
    mysql_data = export_mysql_data()
    
    if mysql_data:
        print(f"✅ Successfully exported {len(mysql_data)} tables")
        
        # Step 2: Show schema creation
        schema = create_postgres_schema()
        print("📝 PostgreSQL schema created")
        
        # Step 3: Instructions for manual import
        print("\n" + "=" * 50)
        print("📋 NEXT STEPS:")
        print("1. Create PostgreSQL database on Render")
        print("2. Run the schema SQL in your PostgreSQL database")
        print("3. Use pgAdmin or similar tool to import data")
        print("4. Update your Flask app to use PostgreSQL")
        print("=" * 50)
        
        # Save exported data to files
        for table_name, data in mysql_data.items():
            filename = f"export_{table_name}.json"
            with open(filename, 'w') as f:
                import json
                json.dump(data, f, indent=2, default=str)
            print(f"💾 Saved {table_name} data to {filename}")
    
    else:
        print("❌ Failed to export data from MySQL")

if __name__ == "__main__":
    main()
