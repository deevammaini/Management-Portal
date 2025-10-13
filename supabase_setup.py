#!/usr/bin/env python3
"""
Convert MySQL Flask app to PostgreSQL for Supabase
This script helps convert your MySQL code to work with PostgreSQL
"""

# Updated requirements.txt for PostgreSQL
requirements_postgres = """
Flask==2.3.3
Flask-CORS==4.0.0
psycopg2-binary==2.9.7
bcrypt==4.0.1
gunicorn==21.2.0
python-dotenv==1.0.0
"""

# Database configuration for Supabase
supabase_config = """
# Supabase PostgreSQL Configuration
DB_CONFIG = {
    'host': os.environ.get('DB_HOST', 'db.your-project.supabase.co'),
    'user': os.environ.get('DB_USER', 'postgres'),
    'password': os.environ.get('DB_PASSWORD', 'your-password'),
    'database': os.environ.get('DB_NAME', 'postgres'),
    'port': int(os.environ.get('DB_PORT', '5432'))
}
"""

print("🚀 Supabase Setup Instructions:")
print("=" * 50)
print("1. Go to supabase.com")
print("2. Sign up with GitHub")
print("3. Create new project")
print("4. Get connection details from Settings > Database")
print("5. Update environment variables in Render")
print("=" * 50)
print("\n📋 Environment Variables for Render:")
print("DB_HOST=db.your-project.supabase.co")
print("DB_USER=postgres")
print("DB_PASSWORD=your-password")
print("DB_NAME=postgres")
print("DB_PORT=5432")
print("=" * 50)
