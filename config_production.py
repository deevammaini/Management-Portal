# Production Database Configuration for cPanel Shared Hosting
# Replace these values with your actual cPanel database credentials

import os

# Production Database Configuration
DB_CONFIG = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'user': os.environ.get('DB_USER', 'yourdomain_admin'),
    'password': os.environ.get('DB_PASSWORD', 'your-db-password'),
    'database': os.environ.get('DB_NAME', 'yourdomain_vendor_mgmt'),
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci',
    'port': 3306
}

# Production Email Configuration
SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USERNAME = os.environ.get('SMTP_USERNAME', 'your-email@gmail.com')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', 'your-app-password')

# Production Flask Configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-this-in-production')
FLASK_ENV = os.environ.get('FLASK_ENV', 'production')

# File Upload Configuration
UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads')
PROFILE_PHOTOS_FOLDER = os.environ.get('PROFILE_PHOTOS_FOLDER', 'profile_photos')

# Create upload directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROFILE_PHOTOS_FOLDER, exist_ok=True)
