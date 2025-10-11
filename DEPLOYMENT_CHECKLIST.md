# cPanel Shared Hosting Deployment Checklist

## Pre-Deployment Checklist ✅

### 1. Application Preparation
- [x] Flask app set to production mode (debug=False)
- [x] React frontend built for production
- [x] Requirements.txt created with all dependencies
- [x] passenger_wsgi.py configured
- [x] Production configuration file created

### 2. Files Ready for Upload
- [x] flask_backend_mysql.py (updated for production)
- [x] passenger_wsgi.py
- [x] requirements.txt
- [x] config_production.py
- [x] frontend/build/ contents
- [x] .htaccess file for Apache
- [x] database_schema.sql

## Step-by-Step Deployment Process

### Step 1: cPanel Python App Setup
1. **Login to cPanel**
   - Access your hosting provider's cPanel
   - Navigate to Software → Setup Python App

2. **Create Python Application**
   - Click "Create Application"
   - Python Version: 3.8 or higher
   - Application Root: `/vendor-management`
   - Application URL: `/` (for root domain)
   - Click "Create"

3. **Configure Virtual Environment**
   - Click "Enter to App" next to your created app
   - Install dependencies: `pip install -r requirements.txt`

### Step 2: Database Setup
1. **Create MySQL Database**
   - Go to Databases → MySQL Databases
   - Create database: `yourdomain_vendor_mgmt`
   - Create user: `yourdomain_admin`
   - Grant all privileges
   - Note down credentials

2. **Import Database Schema**
   - Go to Databases → phpMyAdmin
   - Select your database
   - Import the `database_schema.sql` file

### Step 3: File Upload
1. **Upload Backend Files**
   - Use File Manager or FTP
   - Upload to Python app directory (`/vendor-management/`):
     - flask_backend_mysql.py
     - passenger_wsgi.py
     - requirements.txt
     - config_production.py
     - Create folders: uploads/, profile_photos/

2. **Upload Frontend Files**
   - Upload contents of `frontend/build/` to `public_html/`
   - Upload `.htaccess` to `public_html/`

### Step 4: Environment Configuration
1. **Set Environment Variables in cPanel Python App**
   ```
   FLASK_ENV=production
   SECRET_KEY=your-very-secure-secret-key-here
   DB_HOST=localhost
   DB_NAME=yourdomain_vendor_mgmt
   DB_USER=yourdomain_admin
   DB_PASSWORD=your-database-password
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   UPLOAD_FOLDER=uploads
   PROFILE_PHOTOS_FOLDER=profile_photos
   ```

2. **Update API Configuration**
   - Replace `yourdomain.com` in `frontend/src/utils/api-production.js`
   - Rebuild frontend: `npm run build`
   - Upload new build files

### Step 5: File Permissions
Set correct permissions:
- Files: 644
- Directories: 755
- Upload directories: 755

### Step 6: SSL Certificate
1. **Enable SSL**
   - Go to Security → SSL/TLS
   - Enable SSL certificate
   - Force HTTPS redirect

### Step 7: Testing
1. **Test Application**
   - Visit your domain
   - Test admin login (admin@yellowstonegroup.com / admin123)
   - Test vendor registration
   - Test file uploads
   - Test email functionality

## Important Notes

### Security Considerations
- Change default admin password immediately
- Use strong, unique passwords
- Enable SSL/HTTPS
- Keep dependencies updated

### Performance Optimization
- Enable Gzip compression (included in .htaccess)
- Use CDN for static assets if needed
- Monitor resource usage

### Backup Strategy
- Regular database backups via cPanel
- Code backup via version control
- File uploads backup

## Troubleshooting Common Issues

### 1. Application Won't Start
- Check Python app logs in cPanel
- Verify all dependencies installed
- Check file permissions

### 2. Database Connection Errors
- Verify database credentials
- Check database exists and user has permissions
- Test connection via phpMyAdmin

### 3. Frontend Not Loading
- Check .htaccess file is uploaded
- Verify static files uploaded correctly
- Check browser console for errors

### 4. File Upload Issues
- Check upload directory permissions (755)
- Verify upload directory exists
- Check file size limits

### 5. Email Not Working
- Verify SMTP credentials
- Check if hosting allows SMTP
- Test with different email provider

## Post-Deployment Tasks

1. **Change Default Credentials**
   - Update admin password
   - Update email credentials

2. **Configure Monitoring**
   - Set up error monitoring
   - Monitor resource usage

3. **Documentation**
   - Document admin credentials
   - Document database credentials
   - Create backup procedures

## Support and Maintenance

- Regular security updates
- Database optimization
- Log monitoring
- Performance monitoring
- Backup verification

---

**Deployment Complete!** 🎉

Your Yellow Stone Group Vendor Management System should now be live on your cPanel shared hosting.
