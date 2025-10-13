#!/usr/bin/env python3
"""
Import MySQL data to PlanetScale
This script imports your exported JSON data into PlanetScale MySQL
"""

import mysql.connector
import json
import os
from datetime import datetime

def get_planetscale_connection():
    """Connect to PlanetScale MySQL"""
    config = {
        'host': os.environ.get('DB_HOST', 'aws.connect.psdb.cloud'),
        'user': os.environ.get('DB_USER', 'your-planetscale-user'),
        'password': os.environ.get('DB_PASSWORD', 'your-planetscale-password'),
        'database': os.environ.get('DB_NAME', 'your-planetscale-db'),
        'charset': 'utf8mb4',
        'collation': 'utf8mb4_unicode_ci',
        'port': int(os.environ.get('DB_PORT', '3306')),
        'ssl_disabled': False,
        'ssl_ca': '/etc/ssl/certs/ca-certificates.crt'  # For PlanetScale SSL
    }
    
    try:
        connection = mysql.connector.connect(**config)
        print("✅ Connected to PlanetScale MySQL")
        return connection
    except Exception as e:
        print(f"❌ Error connecting to PlanetScale: {e}")
        return None

def create_tables(connection):
    """Create tables in PlanetScale"""
    print("🏗️ Creating tables in PlanetScale...")
    
    cursor = connection.cursor()
    
    # Read the schema from your original database_schema.sql
    try:
        with open('database_schema.sql', 'r') as f:
            schema_sql = f.read()
        
        # Split by semicolon and execute each statement
        statements = schema_sql.split(';')
        for statement in statements:
            statement = statement.strip()
            if statement and not statement.startswith('--'):
                try:
                    cursor.execute(statement)
                    print(f"✅ Executed: {statement[:50]}...")
                except Exception as e:
                    print(f"⚠️ Warning: {e}")
        
        connection.commit()
        print("✅ Tables created successfully")
        
    except FileNotFoundError:
        print("❌ database_schema.sql not found")
        return False
    
    cursor.close()
    return True

def import_data(connection):
    """Import JSON data into PlanetScale"""
    print("📊 Importing data to PlanetScale...")
    
    cursor = connection.cursor()
    
    # Get all JSON files
    json_files = [f for f in os.listdir('.') if f.startswith('export_') and f.endswith('.json')]
    
    for json_file in json_files:
        table_name = json_file.replace('export_', '').replace('.json', '')
        
        try:
            with open(json_file, 'r') as f:
                data = json.load(f)
            
            if not data:
                print(f"⏭️ Skipping {table_name} (no data)")
                continue
            
            print(f"📊 Importing {len(data)} rows to {table_name}")
            
            # Get column names from first record
            if data:
                columns = list(data[0].keys())
                placeholders = ', '.join(['%s'] * len(columns))
                column_names = ', '.join(columns)
                
                # Clear existing data
                cursor.execute(f"DELETE FROM {table_name}")
                
                # Insert data
                for record in data:
                    values = [record.get(col) for col in columns]
                    query = f"INSERT INTO {table_name} ({column_names}) VALUES ({placeholders})"
                    cursor.execute(query, values)
                
                print(f"✅ Imported {len(data)} rows to {table_name}")
            
        except Exception as e:
            print(f"❌ Error importing {table_name}: {e}")
    
    connection.commit()
    cursor.close()
    print("✅ Data import completed")

def main():
    print("🚀 Starting PlanetScale MySQL Import")
    print("=" * 50)
    
    # Connect to PlanetScale
    connection = get_planetscale_connection()
    
    if not connection:
        print("❌ Failed to connect to PlanetScale")
        print("\n📋 Make sure you have set these environment variables:")
        print("DB_HOST=aws.connect.psdb.cloud")
        print("DB_USER=your-planetscale-username")
        print("DB_PASSWORD=your-planetscale-password")
        print("DB_NAME=your-planetscale-database")
        return
    
    try:
        # Create tables
        if create_tables(connection):
            # Import data
            import_data(connection)
            print("\n🎉 Import completed successfully!")
        else:
            print("❌ Failed to create tables")
    
    except Exception as e:
        print(f"❌ Import failed: {e}")
    
    finally:
        connection.close()
        print("🔌 Connection closed")

if __name__ == "__main__":
    main()
