# Production Database Configuration for PostgreSQL/Supabase
# Replace these values with your actual Supabase database credentials

import os

# Production Database Configuration for PostgreSQL/Supabase
DB_CONFIG = {
    'host': os.environ.get('DB_HOST', 'localhost'),  # Change to your actual Supabase host
    'user': os.environ.get('DB_USER', 'postgres'),   # Change to your actual Supabase user
    'password': os.environ.get('DB_PASSWORD', 'your-actual-password'),  # Change to your actual password
    'database': os.environ.get('DB_NAME', 'postgres'),  # Change to your actual database name
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
