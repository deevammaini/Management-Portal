# CPanel Shared Hosting Deployment Guide

## Files Structure (Production Ready)
```
your_app/
├── flask_backend_mysql.py          # Main Flask application
├── frontend/                        # React frontend (build this)
│   ├── build/                      # Generated after npm run build
│   ├── package.json
│   └── src/
├── uploads/                        # File uploads directory
├── profile_photos/                 # Profile photos directory
├── requirements.txt                # Python dependencies (create this)
├── passenger_wsgi.py               # WSGI entry point (create this)
└── .htaccess                       # Apache configuration (create this)
```

## Step-by-Step Deployment Process

### 1. Prepare Your Application

#### A. Create requirements.txt
```bash
pip freeze > requirements.txt
```

#### B. Build React Frontend
```bash
cd frontend
npm run build
```

#### C. Update Flask Backend for Production
- Change `app.run(debug=True)` to `app.run(debug=False)`
- Update database configuration for CPanel
- Set production SECRET_KEY

### 2. CPanel Setup

#### A. Create Python Application
1. Go to CPanel → Software → Setup Python App
2. Choose Python version (3.8+ recommended)
3. Create virtual environment
4. Set application root directory

#### B. Database Setup
1. Go to CPanel → Databases → MySQL Databases
2. Create new database: `yourdomain_vendor_mgmt`
3. Create new user: `yourdomain_admin`
4. Grant all privileges to user on database
5. Note down: database name, username, password

#### C. Upload Files
1. Upload your application files to the Python app directory
2. Upload React build files to `public_html/` or subdirectory
3. Set proper file permissions (644 for files, 755 for directories)

### 3. Configuration Files

#### A. passenger_wsgi.py
```python
import sys
import os

# Add your app directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

# Import your Flask app
from flask_backend_mysql import app

# This is the WSGI application
application = app
```

#### B. .htaccess (for frontend routing)
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [QSA,L]
```

#### C. Update flask_backend_mysql.py for Production
```python
# At the bottom of flask_backend_mysql.py, change:
if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5000)

# To:
if __name__ == '__main__':
    app.run(debug=False)
```

### 4. Database Migration
1. Access phpMyAdmin from CPanel
2. Run these SQL commands to create tables:

```sql
-- Create admins table
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create vendor_logins table
CREATE TABLE vendor_logins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

-- Create other tables (users, vendors, departments, tasks, projects, tickets)
-- (Include all your existing table creation scripts)
```

### 5. Environment Variables
In CPanel Python App settings, add these environment variables:
- `FLASK_ENV=production`
- `SECRET_KEY=your-secret-key-here`
- `DB_HOST=localhost`
- `DB_NAME=yourdomain_vendor_mgmt`
- `DB_USER=yourdomain_admin`
- `DB_PASSWORD=your-db-password`

### 6. Frontend Configuration
Update `frontend/src/utils/api.js`:
```javascript
const API_BASE = 'https://yourdomain.com/api';  // Your actual domain
```

## Important CPanel Shared Hosting Considerations

### Limitations:
1. **Resource Limits**: CPU, RAM, and process limits
2. **No Background Processes**: Use cron jobs for scheduled tasks
3. **File Permissions**: Must be set correctly (644/755)
4. **Database Connections**: Limited concurrent connections

### Security Best Practices:
1. **Use HTTPS**: Enable SSL certificate
2. **Environment Variables**: Never hardcode secrets
3. **File Permissions**: Restrict access to sensitive files
4. **Database Security**: Use strong passwords

### Performance Tips:
1. **Enable Gzip**: Compress static files
2. **CDN**: Use CDN for static assets
3. **Database Indexing**: Optimize database queries
4. **Caching**: Implement appropriate caching

### Troubleshooting:
1. **Error Logs**: Check CPanel Error Logs
2. **Application Logs**: Check Python app logs
3. **Database Issues**: Verify connection settings
4. **File Permissions**: Ensure correct permissions

## Testing After Deployment:
1. Test all user types login (admin, employee, vendor)
2. Test file uploads/downloads
3. Test email functionality
4. Test database operations
5. Test frontend-backend communication

## Backup Strategy:
1. Regular database backups via CPanel
2. Code backup via version control
3. File uploads backup
4. Configuration backup
