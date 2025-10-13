#!/usr/bin/env python3
"""
Generate Perfect PostgreSQL Schema with Correct Data Types
This script analyzes all exported JSON files and creates a schema with proper PostgreSQL data types
"""

import json
import os
from datetime import datetime

def analyze_json_files():
    """Analyze all JSON files to understand the exact structure and data types"""
    print("🔍 Analyzing exported JSON files for correct data types...")
    
    table_structures = {}
    json_files = [f for f in os.listdir('.') if f.startswith('export_') and f.endswith('.json')]
    
    for json_file in json_files:
        table_name = json_file.replace('export_', '').replace('.json', '')
        
        try:
            with open(json_file, 'r') as f:
                data = json.load(f)
            
            if not data:
                print(f"⏭️ Skipping {table_name} (no data)")
                continue
            
            # Analyze the structure of all records to determine correct data types
            columns = {}
            sample_record = data[0]
            
            for column, value in sample_record.items():
                # Check all records for this column to determine the best data type
                values = [record.get(column) for record in data if record.get(column) is not None]
                
                if not values:
                    columns[column] = 'TEXT'
                    continue
                
                # Determine data type based on actual values
                if all(isinstance(v, bool) for v in values):
                    columns[column] = 'BOOLEAN'
                elif all(isinstance(v, int) for v in values):
                    columns[column] = 'INTEGER'
                elif all(isinstance(v, float) for v in values):
                    columns[column] = 'DECIMAL'
                elif all(isinstance(v, str) for v in values):
                    # Check for specific patterns
                    if 'time' in column.lower() and all(len(v) <= 8 and ':' in v for v in values):
                        columns[column] = 'TIME'
                    elif 'date' in column.lower() and not any(' ' in v for v in values):
                        columns[column] = 'DATE'
                    elif 'date' in column.lower() or 'time' in column.lower() or 'created' in column.lower() or 'updated' in column.lower():
                        columns[column] = 'TIMESTAMP'
                    elif any(len(v) > 255 for v in values):
                        columns[column] = 'TEXT'
                    else:
                        columns[column] = 'VARCHAR(255)'
                else:
                    columns[column] = 'TEXT'
                
                table_structures[table_name] = {
                    'columns': columns,
                    'row_count': len(data)
                }
            
            print(f"✅ Analyzed {table_name}: {len(columns)} columns, {len(data)} rows")
            
        except Exception as e:
            print(f"❌ Error analyzing {table_name}: {e}")
    
    return table_structures

def generate_corrected_schema(table_structures):
    """Generate PostgreSQL schema with correct data types"""
    print("\n🏗️ Generating corrected PostgreSQL schema...")
    
    schema_sql = []
    schema_sql.append("-- Corrected PostgreSQL Schema for YellowStone Management System")
    schema_sql.append("-- Generated from MySQL export analysis with correct data types")
    schema_sql.append(f"-- Generated on: {datetime.now().isoformat()}")
    schema_sql.append("")
    
    # Create tables in dependency order
    dependency_order = [
        'users', 'departments', 'admins', 'vendors', 'projects', 'tasks', 
        'announcements', 'attendance', 'forms', 'tickets', 'templates',
        'contract_templates', 'employment_templates', 'nda_templates',
        'user_notifications', 'vendor_logins', 'vendor_registrations',
        'summary'
    ]
    
    # Add any tables not in the dependency order
    for table_name in table_structures:
        if table_name not in dependency_order:
            dependency_order.append(table_name)
    
    for table_name in dependency_order:
        if table_name not in table_structures:
            continue
            
        table_info = table_structures[table_name]
        columns = table_info['columns']
        
        schema_sql.append(f"-- Create {table_name} table")
        schema_sql.append(f"CREATE TABLE IF NOT EXISTS {table_name} (")
        
        # Add columns
        column_definitions = []
        for column, data_type in columns.items():
            if column == 'id':
                column_definitions.append(f"    {column} SERIAL PRIMARY KEY")
            else:
                column_definitions.append(f"    {column} {data_type}")
        
        schema_sql.append(",\n".join(column_definitions))
        schema_sql.append(");")
        schema_sql.append("")
    
    return "\n".join(schema_sql)

def main():
    print("🔄 Generating Corrected PostgreSQL Schema")
    print("=" * 60)
    
    # Analyze JSON files
    table_structures = analyze_json_files()
    
    if not table_structures:
        print("❌ No table structures found!")
        return
    
    # Generate corrected schema
    corrected_schema = generate_corrected_schema(table_structures)
    
    # Save to file
    schema_file = "corrected_postgres_schema.sql"
    with open(schema_file, 'w', encoding='utf-8') as f:
        f.write(corrected_schema)
    
    print(f"\n🎉 Corrected schema generated!")
    print(f"📁 File created: {schema_file}")
    print(f"📊 Tables analyzed: {len(table_structures)}")
    
    # Show summary
    print("\n📋 Schema Summary:")
    for table_name, info in table_structures.items():
        print(f"  - {table_name}: {len(info['columns'])} columns, {info['row_count']} rows")
    
    print("\n" + "=" * 60)
    print("📋 NEXT STEPS:")
    print("1. ✅ Corrected schema generated")
    print("2. 🔄 Run corrected_postgres_schema.sql in Supabase")
    print("3. 🔄 Run supabase_data_import.sql in Supabase")
    print("4. 🔄 Update Render environment variables")
    print("=" * 60)

if __name__ == "__main__":
    main()
