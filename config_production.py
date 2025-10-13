# Production Database Configuration for PostgreSQL/Supabase
# Replace these values with your actual Supabase database credentials

import os

# Database Configuration - Supports both PostgreSQL (Supabase) and MySQL
# Environment variables override defaults
DB_TYPE = os.environ.get('DB_TYPE', 'postgresql')  # 'postgresql' or 'mysql'

if DB_TYPE == 'mysql':
    # MySQL Configuration (for local development or MySQL cloud)
    DB_CONFIG = {
        'host': os.environ.get('DB_HOST', 'localhost'),
        'user': os.environ.get('DB_USER', 'root'),
        'password': os.environ.get('DB_PASSWORD', 'deevammaini'),
        'database': os.environ.get('DB_NAME', 'vendor_management'),
        'port': int(os.environ.get('DB_PORT', '3306')),
        'charset': 'utf8mb4',
        'collation': 'utf8mb4_unicode_ci'
    }
else:
    # PostgreSQL Configuration (Supabase)
    DB_CONFIG = {
        'host': os.environ.get('DB_HOST', 'aws-1-ap-south-1.pooler.supabase.com'),  # Supabase Session Pooler
        'user': os.environ.get('DB_USER', 'postgres.chrnpxnqfsvyaidiftjq'),   # Supabase user
        'password': os.environ.get('DB_PASSWORD', 'your-supabase-password'),  # Your Supabase password
        'database': os.environ.get('DB_NAME', 'postgres'),  # Supabase database name
        'port': int(os.environ.get('DB_PORT', '5432'))
    }

# Production Email Configuration
SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USERNAME = os.environ.get('SMTP_USERNAME', 'deevam.maini0412@gmail.com')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', 'kukv vgal lsif cuhn')

# Production Flask Configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
FLASK_ENV = os.environ.get('FLASK_ENV', 'development')

# File Upload Configuration
UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads')
PROFILE_PHOTOS_FOLDER = os.environ.get('PROFILE_PHOTOS_FOLDER', 'profile_photos')

# Create upload directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROFILE_PHOTOS_FOLDER, exist_ok=True)
