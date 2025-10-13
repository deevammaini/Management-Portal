#!/usr/bin/env python3
"""
MySQL Data Export Script
This script exports your MySQL data to JSON files for easy migration
"""

import mysql.connector
import json
from datetime import datetime

# MySQL connection (your local database)
mysql_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'deevammaini',
    'database': 'vendor_management'
}

def export_mysql_data():
    """Export data from MySQL to JSON files"""
    print("🔄 Exporting data from MySQL...")
    
    try:
        # Connect to MySQL
        mysql_conn = mysql.connector.connect(**mysql_config)
        mysql_cursor = mysql_conn.cursor(dictionary=True)
        
        # Get all tables
        mysql_cursor.execute("SHOW TABLES")
        tables = [row[f'Tables_in_{mysql_config["database"]}'] for row in mysql_cursor.fetchall()]
        
        exported_tables = {}
        
        for table in tables:
            print(f"📊 Exporting table: {table}")
            mysql_cursor.execute(f"SELECT * FROM {table}")
            data = mysql_cursor.fetchall()
            exported_tables[table] = data
            
            # Save to JSON file
            filename = f"export_{table}.json"
            with open(filename, 'w') as f:
                json.dump(data, f, indent=2, default=str)
            
            print(f"✅ Exported {len(data)} rows from {table} to {filename}")
        
        mysql_conn.close()
        
        # Create summary file
        summary = {
            "export_date": datetime.now().isoformat(),
            "tables_exported": len(tables),
            "table_names": tables,
            "total_records": sum(len(data) for data in exported_tables.values())
        }
        
        with open("export_summary.json", 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"\n🎉 Export completed!")
        print(f"📊 Total tables: {len(tables)}")
        print(f"📊 Total records: {summary['total_records']}")
        print(f"📁 Files created: {len(tables)} JSON files + summary")
        
        return True
        
    except Exception as e:
        print(f"❌ Error exporting from MySQL: {e}")
        return False

def create_postgres_schema():
    """Generate PostgreSQL schema SQL"""
    print("\n🏗️ Generating PostgreSQL schema...")
    
    schema_sql = """
-- PostgreSQL Schema for YellowStone Management System
-- Run this in your PostgreSQL database

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
-- (This is a simplified version - you'll need to add all 36 tables)
"""
    
    with open("postgres_schema.sql", 'w') as f:
        f.write(schema_sql)
    
    print("✅ PostgreSQL schema saved to postgres_schema.sql")

def main():
    print("🚀 Starting MySQL Data Export for PostgreSQL Migration")
    print("=" * 60)
    
    # Export data
    success = export_mysql_data()
    
    if success:
        # Generate schema
        create_postgres_schema()
        
        print("\n" + "=" * 60)
        print("📋 MIGRATION STEPS:")
        print("1. ✅ Data exported to JSON files")
        print("2. ✅ PostgreSQL schema created")
        print("3. 🔄 Create PostgreSQL database on Render")
        print("4. 🔄 Run postgres_schema.sql in your PostgreSQL database")
        print("5. 🔄 Import JSON data using pgAdmin or similar tool")
        print("6. 🔄 Update Flask app to use PostgreSQL")
        print("=" * 60)
        
        print("\n📁 Files created:")
        print("- export_*.json (one for each table)")
        print("- export_summary.json (overview)")
        print("- postgres_schema.sql (PostgreSQL schema)")
    
    else:
        print("❌ Export failed. Please check your MySQL connection.")

if __name__ == "__main__":
    main()
