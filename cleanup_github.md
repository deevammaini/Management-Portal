# 🧹 GitHub Cleanup Guide

## How to Remove Unwanted Files from GitHub

### **Method 1: Remove Files Locally and Push (Recommended)**

```bash
# 1. Remove files locally
git rm filename.txt
git rm -r folder_name/
git rm "file with spaces.txt"

# 2. Commit the removal
git commit -m "Remove unwanted files"

# 3. Push to GitHub
git push origin main
```

### **Method 2: Remove Multiple Files at Once**

```bash
# Remove all files matching a pattern
git rm *.log
git rm *.tmp
git rm -r temp_*

# Remove all files in a directory
git rm -r unwanted_folder/

# Commit and push
git commit -m "Remove multiple unwanted files"
git push origin main
```

### **Method 3: Remove Files from Git History (Advanced)**

```bash
# Remove file from entire Git history (use with caution!)
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch filename.txt' \
--prune-empty --tag-name-filter cat -- --all

# Force push (this rewrites history!)
git push origin --force --all
```

### **Method 4: Using .gitignore to Prevent Future Issues**

Create/update `.gitignore` file:
```gitignore
# Temporary files
*.tmp
*.log
*.cache

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Python
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
env/
venv/
.env

# Node.js
node_modules/
npm-debug.log*

# Build files
build/
dist/
*.tgz
*.tar.gz

# Database files
*.db
*.sqlite
*.sqlite3

# Export files
export_*.json
```

### **Method 5: Clean Up Your Current Repository**

Run these commands in your project directory:

```bash
# 1. Check what files are tracked
git ls-files

# 2. Remove specific unwanted files
git rm export_*.json
git rm test_*.py
git rm setup_*.py
git rm migrate_*.py
git rm import_*.py
git rm generate_*.py
git rm fix_*.sql
git rm complete_postgres_schema.sql
git rm perfect_postgres_schema.sql
git rm postgres_schema.sql
git rm supabase_schema.sql
git rm complete_database_reset.sql
git rm supabase_data_import.sql
git rm RAILWAY_SETUP.md
git rm SUPABASE_IMPORT_GUIDE.md
git rm check_aman_password.py
git rm passenger_wsgi.py
git rm package-lock.json

# 3. Remove directories
git rm -r __pycache__/

# 4. Commit the cleanup
git commit -m "Clean up unwanted files and migration scripts"

# 5. Push to GitHub
git push origin main
```

### **Method 6: Interactive Cleanup**

```bash
# See what files are large
git ls-files | xargs ls -lh | sort -k5 -hr

# Interactive removal
git add -i

# Or use git status to see what's changed
git status
```

## 🚨 **Important Notes:**

1. **Backup First**: Always backup your repository before major cleanup
2. **Test Locally**: Test your application after cleanup to ensure nothing important was removed
3. **Team Coordination**: If working with a team, coordinate cleanup to avoid conflicts
4. **History**: Method 3 rewrites Git history - use only if absolutely necessary

## 🎯 **Quick Cleanup for Your Project:**

Since you've already cleaned up locally, just run:

```bash
git add -A
git commit -m "Final cleanup - remove all migration and temporary files"
git push origin main
```

This will remove all the unwanted files from GitHub that you've already deleted locally.

## 📋 **Files You Should Keep:**

- `flask_backend_mysql.py` (main application)
- `config_production.py` (configuration)
- `requirements.txt` (dependencies)
- `Procfile` (deployment)
- `runtime.txt` (Python version)
- `frontend/` (React app)
- `complete_database_setup.sql` (database setup)
- `DEPLOYMENT_STATUS.md` (documentation)
- `README.md` (project info)

## 🗑️ **Files You Can Remove:**

- All `export_*.json` files
- All `test_*.py` files
- All migration scripts (`migrate_*.py`, `import_*.py`, etc.)
- All temporary SQL files (`fix_*.sql`, old schema files)
- All setup scripts (`setup_*.py`, `generate_*.py`)
- Documentation files for other platforms (`RAILWAY_SETUP.md`, etc.)
- Cache files (`__pycache__/`, `*.pyc`)
- Build artifacts (`package-lock.json` in root)
