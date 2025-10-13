# Railway MySQL Setup Instructions

## Quick Setup Steps:

1. **Go to railway.app**
2. **Sign up with GitHub**
3. **Click "New Project"**
4. **Select "Database" → "MySQL"**
5. **Name it: yellowstone-mysql**
6. **Click "Deploy"**

## After Deployment:
You'll get connection details like:
- Host: mysql.railway.internal
- Port: 3306
- Database: railway
- Username: root
- Password: (generated password)

## Update Render Environment Variables:
```
DB_HOST=mysql.railway.internal
DB_USER=root
DB_PASSWORD=your-generated-password
DB_NAME=railway
DB_PORT=3306
```

## Import Your Data:
1. Connect to Railway MySQL using MySQL Workbench or similar
2. Run your database_schema.sql
3. Import your exported JSON data
