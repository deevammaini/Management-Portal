#!/usr/bin/env python3
# Flask backend for Yellowstone Management Portal with PostgreSQL/Supabase

from flask import Flask, jsonify, request, send_file, session, send_from_directory, redirect, make_response
from flask_cors import CORS
import os
from datetime import datetime, timedelta
import pg8000
from pg8000 import Error
import bcrypt
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import uuid
import random
import string
import secrets
import base64
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from io import BytesIO
import zipfile
import uuid
import secrets
import json

# Import configuration
try:
    from config_production import SECRET_KEY, FLASK_ENV, DB_CONFIG, SMTP_SERVER, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD
except ImportError:
    # Fallback configuration for local development
    SECRET_KEY = 'dev-secret-key-change-in-production'
    FLASK_ENV = 'development'
    DB_CONFIG = {
        'host': os.environ.get('DB_HOST', 'db.your-project.supabase.co'),
        'user': os.environ.get('DB_USER', 'postgres'),
        'password': os.environ.get('DB_PASSWORD', 'your-password'),
        'database': os.environ.get('DB_NAME', 'postgres'),
        'port': int(os.environ.get('DB_PORT', '5432'))
    }
    SMTP_SERVER = 'smtp.gmail.com'
    SMTP_PORT = 587
    SMTP_USERNAME = 'deevam.maini0412@gmail.com'
    SMTP_PASSWORD = 'kukv vgal lsif cuhn'
    ADMIN_EMAIL = 'deevam.maini0412@gmail.com'

app = Flask(__name__)
CORS(app, 
     supports_credentials=True,
     origins=[
         "http://localhost:3000",  # Local development
         "https://yellowstonexps.netlify.app",  # Netlify production
         "https://yellowstonevendormanagement.netlify.app"  # Your actual Netlify domain
     ])

# Configure session
app.secret_key = SECRET_KEY
app.config['SESSION_COOKIE_SECURE'] = FLASK_ENV == 'production'  # True in production with HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Configure upload folder 
UPLOAD_FOLDER = 'uploads'
PROFILE_PHOTOS_FOLDER = 'profile_photos'
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROFILE_PHOTOS_FOLDER'] = PROFILE_PHOTOS_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create upload directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROFILE_PHOTOS_FOLDER, exist_ok=True)

# Current logged-in user details
CURRENT_USER = {
    "id": None,
    "name": None,
    "email": None,
    "designation": None,
    "department": None,
    "manager": None,
    "employee_code": None,
    "user_type": None
}

def generate_reference_number():
    """Generate a unique reference number for NDA forms"""
    # Format: NDA-YYYY-XXXXXX (where XXXXXX is random alphanumeric)
    year = datetime.now().strftime("%Y")
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"NDA-{year}-{random_part}"

def generate_vendor_password():
    """Generate a unique password for vendor login"""
    # Generate a secure password with letters, numbers, and special characters
    password_length = 12
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(characters) for _ in range(password_length))
    return password

# Database connection helper
def get_db_connection():
    """Get PostgreSQL database connection"""
    try:
        print(f"🔍 Attempting to connect to database...")
        print(f"Host: {DB_CONFIG.get('host', 'NOT_SET')}")
        print(f"Port: {DB_CONFIG.get('port', 'NOT_SET')}")
        print(f"User: {DB_CONFIG.get('user', 'NOT_SET')}")
        print(f"Database: {DB_CONFIG.get('database', 'NOT_SET')}")
        
        connection = pg8000.connect(**DB_CONFIG)
        print("✅ Database connection successful!")
        return connection
    except Error as e:
        print(f"❌ Error connecting to PostgreSQL: {e}")
        print(f"❌ Connection details: {DB_CONFIG}")
        return None

def execute_query(query, params=None, fetch_one=False, fetch_all=False):
    """Execute PostgreSQL query and return results as dictionaries"""
    connection = get_db_connection()
    if not connection:
        print("❌ No database connection available")
        if fetch_all:
            return []  # Return empty list for fetch_all queries
        return None
    
    try:
        cursor = connection.cursor()
        cursor.execute(query, params)
        
        if fetch_one:
            result = cursor.fetchone()
            if result:
                # Get column names
                column_names = [desc[0] for desc in cursor.description]
                # Convert tuple to dictionary
                return dict(zip(column_names, result))
            return None
        elif fetch_all:
            results = cursor.fetchall()
            if results:
                # Get column names
                column_names = [desc[0] for desc in cursor.description]
                # Convert tuples to dictionaries
                return [dict(zip(column_names, row)) for row in results]
            return []  # Return empty list instead of None
        else:
            result = None
        
        connection.commit()
        return result
    except Error as e:
        print(f"❌ Database query error: {e}")
        print(f"Query: {query}")
        print(f"Params: {params}")
        if fetch_all:
            return []  # Return empty list for fetch_all queries
        return None
    finally:
        try:
            cursor.close()
            connection.close()
        except:
            pass

def _generate_avatar(name):
    """Generate avatar initials from name"""
    if not name:
        return 'U'
    
    # Clean the name and split by spaces
    clean_name = name.strip()
    name_parts = clean_name.split(' ')
    
    # Get first character of first part
    first_char = name_parts[0][0].upper() if name_parts[0] else 'U'
    
    # Get first character of second part if it exists and has content
    second_char = ''
    if len(name_parts) > 1 and name_parts[1]:
        second_char = name_parts[1][0].upper()
    
    return first_char + second_char

# Helper functions
def allowed_image_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS

def get_tasks_data():
    """Get all tasks from MySQL"""
    try:
        query = "SELECT * FROM tasks"
        tasks = execute_query(query, fetch_all=True)
        return tasks or []
    except Exception as e:
        print(f"Error getting tasks: {e}")
        return []

def save_task(task_data):
    """Save task to MySQL"""
    try:
        query = """
        INSERT INTO tasks (title, description, status, priority, assigned_to, assigned_by, due_date, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            task_data.get('title'),
            task_data.get('description'),
            task_data.get('status', 'Pending'),
            task_data.get('priority', 'Medium'),
            task_data.get('assigned_to'),
            task_data.get('assigned_by'),
            task_data.get('due_date'),
            datetime.now()
        )
        task_id = execute_query(query, params)
        if task_id:
            task_data['id'] = task_id
            return task_data
        return None
    except Exception as e:
        print(f"Error saving task: {e}")
        return None

def get_projects_data():
    """Get all projects from MySQL"""
    try:
        query = "SELECT * FROM projects"
        projects = execute_query(query, fetch_all=True)
        return projects or []
    except Exception as e:
        print(f"Error getting projects: {e}")
        return []

def save_project(project_data):
    """Save project to MySQL"""
    try:
        query = """
        INSERT INTO projects (name, description, status, start_date, end_date, created_at)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        params = (
            project_data.get('name'),
            project_data.get('description'),
            project_data.get('status', 'Active'),
            project_data.get('start_date'),
            project_data.get('end_date'),
            datetime.now()
        )
        project_id = execute_query(query, params)
        if project_id:
            project_data['id'] = project_id
            return project_data
        return None
    except Exception as e:
        print(f"Error saving project: {e}")
        return None

def get_workflows_data():
    """Get all workflows from MySQL"""
    try:
        query = "SELECT * FROM workflows"
        workflows = execute_query(query, fetch_all=True)
        return workflows or []
    except Exception as e:
        print(f"Error getting workflows: {e}")
        return []

def save_workflow(workflow_data):
    """Save workflow to MySQL"""
    try:
        query = """
        INSERT INTO workflows (name, description, status, priority, assigned_to, created_at)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        params = (
            workflow_data.get('name'),
            workflow_data.get('description'),
            workflow_data.get('status', 'Active'),
            workflow_data.get('priority', 'Medium'),
            workflow_data.get('assigned_to'),
            datetime.now()
        )
        workflow_id = execute_query(query, params)
        if workflow_id:
            workflow_data['id'] = workflow_id
            return workflow_data
        return None
    except Exception as e:
        print(f"Error saving workflow: {e}")
        return None

def get_tickets_data():
    """Get all tickets from MySQL"""
    try:
        query = "SELECT * FROM tickets"
        tickets = execute_query(query, fetch_all=True)
        return tickets or []
    except Exception as e:
        print(f"Error getting tickets: {e}")
        return []

def save_ticket(ticket_data):
    """Save ticket to MySQL"""
    try:
        query = """
        INSERT INTO tickets (title, description, status, priority, assigned_to, created_by, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            ticket_data.get('title'),
            ticket_data.get('description'),
            ticket_data.get('status', 'Open'),
            ticket_data.get('priority', 'Medium'),
            ticket_data.get('assigned_to'),
            ticket_data.get('created_by'),
            datetime.now()
        )
        ticket_id = execute_query(query, params)
        if ticket_id:
            ticket_data['id'] = ticket_id
            return ticket_data
        return None
    except Exception as e:
        print(f"Error saving ticket: {e}")
        return None

def get_vendors_data():
    """Get all vendors from PostgreSQL"""
    try:
        # First check if table exists
        table_check = execute_query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'vendors')", fetch_one=True)
        if not table_check or not table_check['exists']:
            print("❌ Vendors table does not exist!")
            return []
        
        query = "SELECT * FROM vendors"
        print(f"🔍 Executing vendors query: {query}")
        vendors = execute_query(query, fetch_all=True)
        print(f"🔍 Vendors query result: {vendors}")
        if vendors is None:
            print("⚠️ Vendors query returned None")
            return []
        print(f"✅ Vendors query returned {len(vendors) if vendors else 0} records")
        return vendors
    except Exception as e:
        print(f"❌ Error getting vendors: {e}")
        return []

def get_nda_requests_data():
    """Get all NDA requests from PostgreSQL"""
    try:
        # First check if table exists
        table_check = execute_query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'nda_requests')", fetch_one=True)
        if not table_check or not table_check['exists']:
            print("❌ NDA requests table does not exist!")
            return []
        
        query = "SELECT * FROM nda_requests"
        print(f"🔍 Executing NDA requests query: {query}")
        nda_requests = execute_query(query, fetch_all=True)
        print(f"🔍 NDA requests query result: {nda_requests}")
        if nda_requests is None:
            print("⚠️ NDA requests query returned None")
            return []
        print(f"✅ NDA requests query returned {len(nda_requests) if nda_requests else 0} records")
        return nda_requests
    except Exception as e:
        print(f"❌ Error getting NDA requests: {e}")
        return []

def get_notifications_data():
    """Get all notifications from MySQL"""
    try:
        query = "SELECT * FROM notifications"
        notifications = execute_query(query, fetch_all=True)
        return notifications or []
    except Exception as e:
        print(f"Error getting notifications: {e}")
        return []

def get_users_data():
    """Get all users from MySQL"""
    try:
        query = "SELECT * FROM users"
        users = execute_query(query, fetch_all=True)
        return users or []
    except Exception as e:
        print(f"Error getting users: {e}")
        return []

# Authentication routes
@app.route('/api/auth/employee-login-by-id', methods=['POST'])
def employee_login_by_id():
    try:
        data = request.get_json()
        employee_id = data.get('employee_id')
        password = data.get('password')
        
        if not employee_id or not password:
            return jsonify({'success': False, 'message': 'Employee ID and password are required'}), 400
        
        # Query user from MySQL with manager name
        query = """
        SELECT u.*, COALESCE(m.name, '') as manager_name
        FROM users u
        LEFT JOIN users m ON u.manager::integer = m.id
        WHERE u.employee_id = %s::text AND u.user_type = 'employee'
        """
        user = execute_query(query, (employee_id,), fetch_one=True)
        
        if not user:
            return jsonify({'success': False, 'message': 'Invalid employee ID'}), 401
        
        # Check password
        if not user['password_hash'] or user['password_hash'] == '':
            return jsonify({'success': False, 'message': 'No password set. Please register first.'}), 401
        
        if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return jsonify({'success': False, 'message': 'Invalid password'}), 401
        
        # Update session
        session['user_id'] = user['id']
        session['user_type'] = 'employee'
        
        # Update current user
        CURRENT_USER.update({
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'designation': user.get('designation'),
            'department': user.get('department'),
            'manager': user.get('manager'),
            'employee_code': user['employee_id'],
            'user_type': 'employee'
        })
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'employee_id': user['employee_id'],
                'designation': user.get('designation'),
                'department': user.get('department'),
                'manager': user.get('manager_name'),
                'user_type': 'employee'
            }
        })
        
    except Exception as e:
        print(f"Employee login error: {e}")
        return jsonify({'success': False, 'message': 'Login failed'}), 500

@app.route('/api/auth/current-user', methods=['GET'])
def get_current_user():
    try:
        user_id = session.get('user_id')
        user_type = session.get('user_type')
        
        if not user_id or not user_type:
            return jsonify({'success': False, 'message': 'Not authenticated'}), 401
        
        if user_type == 'admin':
            # Query admin from admins table
            query = "SELECT * FROM admins WHERE id = %s AND is_active = 1"
            user = execute_query(query, (user_id,), fetch_one=True)
            
            if not user:
                return jsonify({'success': False, 'message': 'Admin not found'}), 404
                
            return jsonify({
                'success': True,
                'user': {
                    'id': user['id'],
                    'name': user['full_name'],
                    'email': user['email'],
                    'username': user['username'],
                    'role': user['role'],
                    'user_type': 'admin'
                }
            })
            
        elif user_type == 'employee':
            # Query employee from users table
            query = "SELECT * FROM users WHERE id = %s AND user_type = 'employee'"
            user = execute_query(query, (user_id,), fetch_one=True)
            
            if not user:
                return jsonify({'success': False, 'message': 'Employee not found'}), 404
            
            return jsonify({
                'success': True,
                'user': {
                    'id': user['id'],
                    'name': user['name'],
                    'email': user['email'],
                    'employee_id': user.get('employee_id'),
                    'designation': user.get('designation'),
                    'department': user.get('department'),
                    'manager': user.get('manager'),
                    'user_type': 'employee'
                }
            })
            
        elif user_type == 'vendor':
            # Query vendor from vendor_logins table
            query = "SELECT vl.*, v.company_name, v.contact_person FROM vendor_logins vl JOIN vendors v ON vl.vendor_id = v.id WHERE vl.vendor_id = %s AND vl.is_active = 1"
            user = execute_query(query, (user_id,), fetch_one=True)
            
            if not user:
                return jsonify({'success': False, 'message': 'Vendor not found'}), 404
            
            return jsonify({
                'success': True,
                'user': {
                    'id': user['vendor_id'],
                    'name': user['company_name'],
                    'email': user['email'],
                    'company': user['company_name'],
                    'contact_person': user['contact_person'],
                    'user_type': 'vendor'
                }
            })
        
        return jsonify({'success': False, 'message': 'Invalid user type'}), 400
        
    except Exception as e:
        print(f"Get current user error: {e}")
        return jsonify({'success': False, 'message': 'Failed to get user'}), 500

@app.route('/api/auth/vendor-login', methods=['POST'])
def vendor_login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password are required'}), 400
        
        # Query vendor from vendor_logins table with approval status
        query = """
        SELECT vl.id, vl.vendor_id, vl.email, vl.password_hash, vl.company_name, vl.contact_person, 
               vl.phone, vl.address, vl.is_active, vl.created_at, vl.last_login,
               v.company_name as vendor_company, v.contact_person as vendor_contact, 
               v.portal_access, v.nda_status, vr.status as registration_status
        FROM vendor_logins vl 
        JOIN vendors v ON vl.vendor_id = v.id 
        LEFT JOIN vendor_registrations vr ON vr.email = vl.email
        WHERE vl.email = %s AND vl.is_active = 1
        """
        vendor = execute_query(query, (email,), fetch_one=True)
        
        if not vendor:
            return jsonify({'success': False, 'message': 'Invalid email or password'}), 401
        
        # Check password
        if not bcrypt.checkpw(password.encode('utf-8'), vendor['password_hash'].encode('utf-8')):
            return jsonify({'success': False, 'message': 'Invalid email or password'}), 401
        
        # Update last login
        update_query = "UPDATE vendor_logins SET last_login = NOW() WHERE id = %s"
        execute_query(update_query, (vendor['id'],))
        
        # Update session
        session['user_id'] = vendor['vendor_id']
        session['user_type'] = 'vendor'
        
        # Update current user
        CURRENT_USER.update({
            'id': vendor['vendor_id'],
            'name': vendor['vendor_company'],
            'email': vendor['email'],
            'company': vendor['vendor_company'],
            'contact_person': vendor['vendor_contact'],
            'user_type': 'vendor'
        })
        
        # Determine access level based on approval status
        has_full_access = (
            vendor['portal_access'] == 1 and 
            vendor['registration_status'] == 'approved'
        )
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'id': vendor['vendor_id'],
                'name': vendor['vendor_company'],
                'email': vendor['email'],
                'company': vendor['vendor_company'],
                'contact_person': vendor['vendor_contact'],
                'user_type': 'vendor',
                'has_full_access': has_full_access,
                'portal_access': vendor['portal_access'],
                'registration_status': vendor['registration_status'],
                'nda_status': vendor['nda_status']
            }
        })
        
    except Exception as e:
        print(f"Vendor login error: {e}")
        return jsonify({'success': False, 'message': 'Login failed'}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    try:
        session.clear()
        CURRENT_USER.update({
            "id": None,
            "name": None,
            "email": None,
            "designation": None,
            "department": None,
            "manager": None,
            "employee_code": None,
            "user_type": None
        })
        return jsonify({'success': True, 'message': 'Logged out successfully'})
    except Exception as e:
        print(f"Logout error: {e}")
        return jsonify({'success': False, 'message': 'Logout failed'}), 500

@app.route('/api/auth/register-admin', methods=['POST'])
def register_admin():
    try:
        data = request.get_json()
        email = data.get('email')
        username = data.get('username')
        full_name = data.get('full_name')
        password = data.get('password')
        
        if not email or not username or not full_name or not password:
            return jsonify({'success': False, 'message': 'All fields are required'}), 400
        
        # Check if admin already exists
        query = "SELECT id FROM admins WHERE email = %s OR username = %s"
        existing_admin = execute_query(query, (email, username), fetch_one=True)
        
        if existing_admin:
            return jsonify({'success': False, 'message': 'Admin with this email or username already exists'}), 400
        
        # Hash password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Insert admin user
        query = """
        INSERT INTO admins (email, username, password_hash, full_name, role, is_active)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        admin_id = execute_query(query, (email, username, password_hash, full_name, 'admin', True))
        
        if admin_id:
            return jsonify({
                'success': True,
                'message': 'Admin account created successfully',
                'admin': {
                    'id': admin_id,
                    'email': email,
                    'username': username,
                    'full_name': full_name,
                    'role': 'admin'
                }
            })
        else:
            return jsonify({'success': False, 'message': 'Failed to create admin account'}), 500
            
    except Exception as e:
        print(f"Admin registration error: {e}")
        return jsonify({'success': False, 'message': 'Registration failed'}), 500

@app.route('/api/auth/register-employee', methods=['POST'])
def register_employee():
    try:
        data = request.get_json()
        email = data.get('email')
        name = data.get('name')
        employee_id = data.get('employee_id')
        designation = data.get('designation')
        department = data.get('department')
        manager = data.get('manager')
        password = data.get('password')
        
        if not email or not name or not employee_id or not password:
            return jsonify({'success': False, 'message': 'Email, name, employee ID, and password are required'}), 400
        
        # Check if employee already exists
        query = "SELECT id, password_hash FROM users WHERE email = %s OR employee_id = %s"
        existing_user = execute_query(query, (email, employee_id), fetch_one=True)
        
        if existing_user:
            # If employee exists but has no password, update with password
            if not existing_user['password_hash']:
                # Hash password
                password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                
                # Update existing employee with password
                update_query = """
                UPDATE users 
                SET password_hash = %s, updated_at = NOW()
                WHERE id = %s
                """
                execute_query(update_query, (password_hash, existing_user['id']))
                
                return jsonify({'success': True, 'message': 'Employee account created successfully'})
            else:
                return jsonify({'success': False, 'message': 'An account already exists for this employee. Please use the login page or contact your administrator to reset your password.'}), 400
        
        # Hash password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Insert employee user
        query = """
        INSERT INTO users (email, password_hash, name, employee_id, designation, department, manager, user_type)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        user_id = execute_query(query, (email, password_hash, name, employee_id, designation, department, manager, 'employee'))
        
        if user_id:
            return jsonify({
                'success': True,
                'message': 'Employee account created successfully',
                'user_id': user_id
            })
        else:
            return jsonify({'success': False, 'message': 'Failed to create employee account'}), 500
            
    except Exception as e:
        print(f"Employee registration error: {e}")
        return jsonify({'success': False, 'message': 'Registration failed'}), 500

@app.route('/api/auth/register-vendor', methods=['POST'])
def register_vendor():
    try:
        data = request.get_json()
        email = data.get('email')
        company_name = data.get('company_name')
        contact_person = data.get('contact_person')
        phone = data.get('phone')
        address = data.get('address')
        password = data.get('password')
        
        if not email or not company_name or not password:
            return jsonify({'success': False, 'message': 'Email, company name, and password are required'}), 400
        
        # Check if vendor already exists
        query = "SELECT id FROM vendors WHERE email = %s"
        existing_vendor = execute_query(query, (email,), fetch_one=True)
        
        if existing_vendor:
            return jsonify({'success': False, 'message': 'Vendor with this email already exists'}), 400
        
        # Hash password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Insert vendor
        query = """
        INSERT INTO vendors (email, company_name, contact_person, phone, address, nda_status)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        vendor_id = execute_query(query, (email, company_name, contact_person, phone, address, 'pending'))
        
        if vendor_id:
            # Insert vendor login credentials
            login_query = """
            INSERT INTO vendor_logins (vendor_id, email, password_hash, company_name, contact_person, phone, address, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            execute_query(login_query, (vendor_id, email, password_hash, company_name, contact_person, phone, address, True))
            
            return jsonify({
                'success': True,
                'message': 'Vendor account created successfully',
                'vendor': {
                    'id': vendor_id,
                    'email': email,
                    'company_name': company_name,
                    'contact_person': contact_person,
                    'phone': phone,
                    'address': address
                }
            })
        else:
            return jsonify({'success': False, 'message': 'Failed to create vendor account'}), 500
            
    except Exception as e:
        print(f"Vendor registration error: {e}")
        return jsonify({'success': False, 'message': 'Registration failed'}), 500

@app.route('/api/auth/admin-login', methods=['POST'])
def admin_login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'success': False, 'message': 'Username and password are required'}), 400
        
        # Query admin from admins table - check both email and username for admin login
        query = "SELECT * FROM admins WHERE (email = %s OR username = %s) AND is_active = 1"
        admin = execute_query(query, (username, username), fetch_one=True)
        
        if not admin:
            return jsonify({'success': False, 'message': 'Invalid username or password'}), 401
        
        # Check password
        if not bcrypt.checkpw(password.encode('utf-8'), admin['password_hash'].encode('utf-8')):
            return jsonify({'success': False, 'message': 'Invalid username or password'}), 401
        
        # Update last login
        update_query = "UPDATE admins SET last_login = NOW() WHERE id = %s"
        execute_query(update_query, (admin['id'],))
        
        # Update session
        session['user_id'] = admin['id']
        session['user_type'] = 'admin'
        
        # Update current user
        CURRENT_USER.update({
            'id': admin['id'],
            'name': admin['full_name'],
            'email': admin['email'],
            'username': admin['username'],
            'user_type': 'admin'
        })
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'id': admin['id'],
                'name': admin['full_name'],
                'email': admin['email'],
                'username': admin['username'],
                'user_type': 'admin'
            }
        })
        
    except Exception as e:
        print(f"Admin login error: {e}")
        return jsonify({'success': False, 'message': 'Login failed'}), 500

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to test database connection"""
    try:
        # Test database connection
        connection = get_db_connection()
        if not connection:
            return jsonify({
                'status': 'error',
                'message': 'Database connection failed',
                'database': 'disconnected'
            }), 500
        
        # Test simple query
        result = execute_query("SELECT 1 as test", fetch_one=True)
        if not result:
            return jsonify({
                'status': 'error',
                'message': 'Database query failed',
                'database': 'connected_but_query_failed'
            }), 500
        
        # Test vendors table
        vendors_count = execute_query("SELECT COUNT(*) FROM vendors", fetch_one=True)
        users_count = execute_query("SELECT COUNT(*) FROM users", fetch_one=True)
        
        return jsonify({
            'status': 'healthy',
            'message': 'All systems operational',
            'database': 'connected',
            'vendors_count': vendors_count['count'] if vendors_count else 0,
            'users_count': users_count['count'] if users_count else 0
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Health check failed: {str(e)}',
            'database': 'error'
        }), 500

# Dashboard routes
@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    try:
        # Get counts from different tables
        tasks_query = "SELECT COUNT(*) as count FROM tasks"
        projects_query = "SELECT COUNT(*) as count FROM projects"
        workflows_query = "SELECT COUNT(*) as count FROM workflows"
        tickets_query = "SELECT COUNT(*) as count FROM tickets"
        users_query = "SELECT COUNT(*) as count FROM users"
        
        tasks_count = execute_query(tasks_query, fetch_one=True)
        projects_count = execute_query(projects_query, fetch_one=True)
        workflows_count = execute_query(workflows_query, fetch_one=True)
        tickets_count = execute_query(tickets_query, fetch_one=True)
        users_count = execute_query(users_query, fetch_one=True)
        
        return jsonify({
            'total_tasks': tasks_count['count'] if tasks_count else 0,
            'total_projects': projects_count['count'] if projects_count else 0,
            'total_workflows': workflows_count['count'] if workflows_count else 0,
            'total_tickets': tickets_count['count'] if tickets_count else 0,
            'active_users': users_count['count'] if users_count else 0
        })
        
    except Exception as e:
        print(f"Dashboard stats error: {e}")
        return jsonify({'error': 'Failed to get dashboard stats'}), 500

@app.route('/api/auth/employee-details/<employee_id>', methods=['GET'])
def get_employee_details_by_id(employee_id):
    """Get employee details by employee ID for registration"""
    try:
        print(f"Fetching employee details for ID: {employee_id}")
        query = """
        SELECT u.id, u.name, u.email, u.employee_id, u.designation, u.department, 
               COALESCE(m.name, '') as manager_name, u.phone, u.address, u.hire_date, 
               u.salary, u.emergency_contact, u.status
        FROM users u
        LEFT JOIN users m ON u.manager::integer = m.id
        WHERE u.user_type = 'employee' AND u.employee_id = %s
        """
        employee = execute_query(query, (employee_id,), fetch_one=True)
        print(f"Query result: {employee}")
        
        if not employee:
            print("Employee not found")
            return jsonify({'error': 'Employee not found'}), 404
        
        response_data = {
            'success': True,
            'employee': {
                'id': employee['id'],
                'name': employee['name'],
                'email': employee['email'],
                'employee_id': employee['employee_id'],
                'designation': employee['designation'],
                'department': employee['department'],
                'manager': employee['manager_name'],
                'phone': employee['phone'],
                'address': employee['address'],
                'hire_date': employee['hire_date'],
                'salary': employee['salary'],
                'emergency_contact': employee['emergency_contact'],
                'status': employee['status']
            }
        }
        print(f"Returning response: {response_data}")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Get employee details error: {e}")
        return jsonify({'error': 'Failed to get employee details'}), 500

# Attendance Management API endpoints
@app.route('/api/employee/attendance/clock-in', methods=['POST'])
def clock_in():
    """Employee clock in"""
    try:
        data = request.get_json()
        employee_id = data.get('employee_id')
        
        if not employee_id:
            return jsonify({'error': 'Employee ID is required'}), 400
        
        # Get user ID from employee_id
        user_query = "SELECT id FROM users WHERE employee_id = %s::text AND user_type = 'employee'"
        user = execute_query(user_query, (employee_id,), fetch_one=True)
        
        if not user:
            return jsonify({'error': 'Employee not found'}), 404
        
        from datetime import datetime, time, date
        
        current_time = datetime.now()
        current_date = current_time.date()
        current_time_only = current_time.time()
        
        # Check if already clocked in today
        check_query = "SELECT id, clock_in_time FROM attendance WHERE employee_id = %s AND date = %s"
        existing = execute_query(check_query, (user['id'], current_date), fetch_one=True)
        
        if existing and existing['clock_in_time']:
            return jsonify({'error': 'Already clocked in today'}), 400
        
        # Determine status based on time
        late_threshold = time(10, 0)  # 10:00 AM
        half_day_threshold = time(10, 30)  # 10:30 AM
        
        if current_time_only <= late_threshold:
            status = 'Present'
            late_minutes = 0
        elif current_time_only <= half_day_threshold:
            status = 'Late'
            late_minutes = int((current_time_only.hour - 9) * 60 + current_time_only.minute - 30)
        else:
            status = 'Half Day'
            late_minutes = int((current_time_only.hour - 9) * 60 + current_time_only.minute - 30)
        
        # Insert or update attendance record
        if existing:
            update_query = """
            UPDATE attendance 
            SET clock_in_time = %s, status = %s, late_minutes = %s, updated_at = NOW()
            WHERE id = %s
            """
            execute_query(update_query, (current_time_only, status, late_minutes, existing['id']))
        else:
            insert_query = """
            INSERT INTO attendance (employee_id, date, clock_in_time, status, late_minutes, created_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
            """
            execute_query(insert_query, (employee_id, current_date, current_time_only, status, late_minutes))
        
        return jsonify({
            'success': True, 
            'message': f'Clocked in successfully at {current_time_only.strftime("%H:%M")}',
            'status': status,
            'late_minutes': late_minutes
        })
        
    except Exception as e:
        print(f"Clock in error: {e}")
        return jsonify({'error': 'Failed to clock in'}), 500

@app.route('/api/employee/attendance/clock-out', methods=['POST'])
def clock_out():
    """Employee clock out"""
    try:
        data = request.get_json()
        employee_id = data.get('employee_id')
        
        if not employee_id:
            return jsonify({'error': 'Employee ID is required'}), 400
        
        # Get user ID from employee_id
        user_query = "SELECT id FROM users WHERE employee_id = %s::text AND user_type = 'employee'"
        user = execute_query(user_query, (employee_id,), fetch_one=True)
        
        if not user:
            return jsonify({'error': 'Employee not found'}), 404
        
        from datetime import datetime, time, date
        
        current_time = datetime.now()
        current_date = current_time.date()
        current_time_only = current_time.time()
        
        # Check if clocked in today
        check_query = "SELECT id, clock_in_time, status FROM attendance WHERE employee_id = %s AND date = %s"
        attendance = execute_query(check_query, (user['id'], current_date), fetch_one=True)
        
        if not attendance or not attendance['clock_in_time']:
            return jsonify({'error': 'Please clock in first'}), 400
        
        if attendance['clock_out_time']:
            return jsonify({'error': 'Already clocked out today'}), 400
        
        # Calculate total hours
        clock_in_time = attendance['clock_in_time']
        total_minutes = (current_time_only.hour - clock_in_time.hour) * 60 + (current_time_only.minute - clock_in_time.minute)
        total_hours = round(total_minutes / 60, 2)
        
        # Update attendance record
        update_query = """
        UPDATE attendance 
        SET clock_out_time = %s, total_hours = %s, updated_at = NOW()
        WHERE id = %s
        """
        execute_query(update_query, (current_time_only, total_hours, attendance['id']))
        
        return jsonify({
            'success': True, 
            'message': f'Clocked out successfully at {current_time_only.strftime("%H:%M")}',
            'total_hours': total_hours
        })
        
    except Exception as e:
        print(f"Clock out error: {e}")
        return jsonify({'error': 'Failed to clock out'}), 500

@app.route('/api/employee/attendance/status', methods=['GET'])
def get_attendance_status():
    """Get today's attendance status for employee"""
    try:
        employee_id = request.args.get('employee_id')
        
        if not employee_id:
            return jsonify({'error': 'Employee ID is required'}), 400
        
        # Get user ID from employee_id
        user_query = "SELECT id FROM users WHERE employee_id = %s::text AND user_type = 'employee'"
        user = execute_query(user_query, (employee_id,), fetch_one=True)
        
        if not user:
            return jsonify({'error': 'Employee not found'}), 404
        
        from datetime import date
        
        current_date = date.today()
        
        query = """
        SELECT clock_in_time, clock_out_time, status, total_hours, late_minutes
        FROM attendance 
        WHERE employee_id = %s AND date = %s
        """
        attendance = execute_query(query, (user['id'], current_date), fetch_one=True)
        
        if not attendance:
            return jsonify({
                'success': True,
                'attendance': {
                    'clocked_in': False,
                    'clocked_out': False,
                    'status': 'Absent',
                    'clock_in_time': None,
                    'clock_out_time': None,
                    'total_hours': 0,
                    'late_minutes': 0
                }
            })
        
        return jsonify({
            'success': True,
            'attendance': {
                'clocked_in': attendance['clock_in_time'] is not None,
                'clocked_out': attendance['clock_out_time'] is not None,
                'status': attendance['status'],
                'clock_in_time': attendance['clock_in_time'].strftime('%H:%M') if attendance['clock_in_time'] else None,
                'clock_out_time': attendance['clock_out_time'].strftime('%H:%M') if attendance['clock_out_time'] else None,
                'total_hours': float(attendance['total_hours']) if attendance['total_hours'] else 0,
                'late_minutes': attendance['late_minutes'] or 0
            }
        })
        
    except Exception as e:
        print(f"Get attendance status error: {e}")
        return jsonify({'error': 'Failed to get attendance status'}), 500

@app.route('/api/employee/attendance/history', methods=['GET'])
def get_attendance_history():
    """Get attendance history for employee"""
    try:
        employee_id = request.args.get('employee_id')
        month = request.args.get('month', '')
        year = request.args.get('year', '')
        
        if not employee_id:
            return jsonify({'error': 'Employee ID is required'}), 400
        
        # Get user ID from employee_id
        user_query = "SELECT id FROM users WHERE employee_id = %s::text AND user_type = 'employee'"
        user = execute_query(user_query, (employee_id,), fetch_one=True)
        
        if not user:
            return jsonify({'error': 'Employee not found'}), 404
        
        from datetime import date, datetime
        
        if month and year:
            # Get specific month
            query = """
            SELECT date, clock_in_time, clock_out_time, status, total_hours, late_minutes
            FROM attendance 
            WHERE employee_id = %s AND YEAR(date) = %s AND MONTH(date) = %s
            ORDER BY date DESC
            """
            attendance_records = execute_query(query, (user['id'], year, month), fetch_all=True)
        else:
            # Get current month
            current_date = date.today()
            query = """
            SELECT date, clock_in_time, clock_out_time, status, total_hours, late_minutes
            FROM attendance 
            WHERE employee_id = %s AND YEAR(date) = %s AND MONTH(date) = %s
            ORDER BY date DESC
            """
            attendance_records = execute_query(query, (user['id'], current_date.year, current_date.month), fetch_all=True)
        
        # Format the data
        formatted_records = []
        for record in attendance_records:
            formatted_records.append({
                'date': record['date'].strftime('%Y-%m-%d'),
                'clock_in_time': record['clock_in_time'].strftime('%H:%M') if record['clock_in_time'] else None,
                'clock_out_time': record['clock_out_time'].strftime('%H:%M') if record['clock_out_time'] else None,
                'status': record['status'],
                'total_hours': float(record['total_hours']) if record['total_hours'] else 0,
                'late_minutes': record['late_minutes'] or 0
            })
        
        return jsonify({
            'success': True,
            'attendance_history': formatted_records
        })
        
    except Exception as e:
        print(f"Get attendance history error: {e}")
        return jsonify({'error': 'Failed to get attendance history'}), 500

@app.route('/api/admin/attendance', methods=['GET'])
def get_all_attendance():
    """Get all attendance records for admin"""
    try:
        from datetime import date
        
        current_date = date.today()
        
        query = """
        SELECT a.*, u.name as employee_name, u.employee_id
        FROM attendance a
        JOIN users u ON a.employee_id = u.id
        WHERE a.date = %s AND u.user_type = 'employee'
        ORDER BY u.name
        """
        attendance_records = execute_query(query, (current_date,), fetch_all=True)
        
        # Format the data
        formatted_records = []
        for record in attendance_records:
            formatted_records.append({
                'id': record['id'],
                'employee_id': record['employee_id'],
                'employee_name': record['employee_name'],
                'employee_code': record['employee_id'],
                'date': record['date'].strftime('%Y-%m-%d'),
                'clock_in_time': record['clock_in_time'].strftime('%H:%M') if record['clock_in_time'] else None,
                'clock_out_time': record['clock_out_time'].strftime('%H:%M') if record['clock_out_time'] else None,
                'status': record['status'],
                'total_hours': float(record['total_hours']) if record['total_hours'] else 0,
                'late_minutes': record['late_minutes'] or 0
            })
        
        return jsonify({
            'success': True,
            'attendance_records': formatted_records
        })
        
    except Exception as e:
        print(f"Get all attendance error: {e}")
        return jsonify({'error': 'Failed to get attendance records'}), 500

# Vendor Registration API endpoints
@app.route('/api/vendor/register', methods=['POST'])
def register_vendor_detailed():
    """Register vendor for full portal access with comprehensive YellowStone form data"""
    try:
        data = request.get_json()
        
        # Debug: Print received data
        print(f"Received registration data: {data}")
        
        # Extract basic fields that match the current table structure
        company_name = data.get('companyName')
        contact_person = data.get('contactPersonName') or data.get('contactPerson')
        email = data.get('emailAddress') or data.get('email')
        phone = data.get('mobileNumber') or data.get('phone')
        address = data.get('communicationAddress') or data.get('address')
        business_type = data.get('companyType') or data.get('businessType')
        services = data.get('coreBusinessActivity') or data.get('services')
        experience = data.get('typeOfActivity') or data.get('experience')
        certifications = data.get('qualityCertifications') or data.get('certifications', '')
        vendor_references = data.get('majorCustomers') or data.get('references', '')
        
        # Debug: Print extracted fields
        print(f"Extracted fields - Company: {company_name}, Contact: {contact_person}, Email: {email}")
        
        # Validate required fields
        required_fields = [
            company_name, contact_person, email, phone, address, business_type, services, experience
        ]
        
        if not all(required_fields):
            missing_fields = [field for field, value in zip(['company_name', 'contact_person', 'email', 'phone', 'address', 'business_type', 'services', 'experience'], required_fields) if not value]
            print(f"Missing required fields: {missing_fields}")
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        
        # Check if vendor already exists
        check_query = "SELECT id FROM vendor_registrations WHERE email = %s"
        existing = execute_query(check_query, (email,), fetch_one=True)
        
        if existing:
            print(f"Vendor with email {email} already exists")
            return jsonify({'error': 'Vendor with this email already registered'}), 400
        
        # Insert vendor registration with current table structure
        insert_query = """
        INSERT INTO vendor_registrations 
        (company_name, contact_person, email, phone, address, business_type, 
         services, experience, certifications, vendor_references, status, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending', NOW())
        """
        
        print(f"Executing insert query with data: {company_name}, {contact_person}, {email}")
        execute_query(insert_query, (
            company_name, contact_person, email, phone, address, business_type,
            services, experience, certifications, vendor_references
        ))
        
        print(f"Successfully inserted vendor registration for {company_name}")
        return jsonify({
            'success': True,
            'message': 'Comprehensive vendor registration submitted successfully. You will receive an email once approved.'
        })
        
    except Exception as e:
        print(f"Vendor registration error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to submit vendor registration'}), 500

# Admin API endpoints for vendor registration management
@app.route('/api/admin/vendor-registrations', methods=['GET'])
def get_vendor_registrations():
    """Get all vendor registrations for admin review"""
    try:
        query = """
        SELECT id, company_name, contact_person, email, phone, address, 
               business_type, services, experience, certifications, 
               vendor_references, status, created_at, updated_at
        FROM vendor_registrations 
        ORDER BY created_at DESC
        """
        
        registrations = execute_query(query, fetch_all=True)
        
        return jsonify({
            'success': True,
            'registrations': registrations
        })
        
    except Exception as e:
        print(f"Get vendor registrations error: {e}")
        return jsonify({'error': 'Failed to get vendor registrations'}), 500

@app.route('/api/admin/vendor-registrations/<int:registration_id>/approve', methods=['POST'])
def approve_vendor_registration(registration_id):
    """Approve a vendor registration"""
    try:
        # Get registration details
        query = "SELECT * FROM vendor_registrations WHERE id = %s"
        registration = execute_query(query, (registration_id,), fetch_one=True)
        
        if not registration:
            return jsonify({'success': False, 'message': 'Registration not found'}), 404
        
        if registration['status'] != 'pending':
            return jsonify({'success': False, 'message': 'Registration is not pending'}), 400
        
        # Update registration status
        update_query = "UPDATE vendor_registrations SET status = 'approved', updated_at = NOW() WHERE id = %s"
        execute_query(update_query, (registration_id,))
        
        # Generate unique password for vendor
        vendor_password = generate_vendor_password()
        password_hash = bcrypt.hashpw(vendor_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Create vendor account in vendors table with full portal access
        vendor_query = """
        INSERT INTO vendors (email, company_name, contact_person, phone, address, nda_status, portal_access)
        VALUES (%s, %s, %s, %s, %s, 'pending', 1)
        """
        vendor_id = execute_query(vendor_query, (
            registration['email'],
            registration['company_name'],
            registration['contact_person'],
            registration['phone'],
            registration['address']
        ))
        
        if vendor_id:
            # Create vendor login credentials
            login_query = """
            INSERT INTO vendor_logins (vendor_id, email, password_hash, company_name, contact_person, phone, address, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            execute_query(login_query, (
                vendor_id, registration['email'], password_hash,
                registration['company_name'], registration['contact_person'],
                registration['phone'], registration['address'], True
            ))
            
            # Create vendor user account for login
            # Check if user already exists
            check_query = "SELECT id FROM users WHERE email = %s"
            existing_user = execute_query(check_query, (registration['email'],), fetch_one=True)
            
            if existing_user:
                # Update existing user
                user_query = """
                UPDATE users SET password_hash = %s, user_type = %s, updated_at = %s
                WHERE email = %s
                """
                execute_query(user_query, (password_hash, 'vendor', datetime.now(), registration['email']))
            else:
                # Insert new user
                user_query = """
                INSERT INTO users (email, password_hash, name, user_type, created_at)
                VALUES (%s, %s, %s, %s, %s)
                """
                execute_query(user_query, (
                    registration['email'], password_hash, registration['contact_person'], 'vendor', datetime.now()
                ))
        
        # Send approval email with login credentials
        try:
            msg = MIMEMultipart()
            msg['From'] = SMTP_USERNAME
            msg['To'] = registration['email']
            msg['Subject'] = "🎉 Portal Access Granted - YellowStone Xperiences"
            
            body = f"""
Dear {registration['contact_person']},

Congratulations! Your vendor registration has been approved and your portal access has been fully granted.

COMPANY: {registration['company_name']}
CONTACT PERSON: {registration['contact_person']}
EMAIL: {registration['email']}

LOGIN CREDENTIALS:
Email: {registration['email']}
Password: {vendor_password}
Portal URL: https://yellowstonexperiences.com/vendor_portal/

IMPORTANT SECURITY REQUIREMENTS:
1. You are required to change your password immediately upon first login
2. Maintain strict confidentiality of your login credentials
3. Access the portal only from secure, authorized devices
4. Report any suspicious activity immediately to our IT Security Department

NEXT STEPS:
- Log in to the portal using the provided credentials
- Complete your profile setup
- Review available partnership opportunities
- Familiarize yourself with our vendor guidelines and procedures
- Complete the NDA process to unlock full portal features

PORTAL FEATURES AVAILABLE:
✅ Vendor Dashboard Access
✅ Project Opportunities
✅ Task Management
✅ Communication Portal
✅ Document Management
✅ Reporting Tools

Should you encounter any technical difficulties or require assistance, please contact our Vendor Support Team at your earliest convenience.

We look forward to a successful and mutually beneficial partnership.

Yours sincerely,

Harpreet Singh
CEO
YellowStone Xperiences Pvt Ltd
Email: Harpreet.singh@yellowstonexps.com
Phone: [Contact Number]
Address: Plot # 2, ITC, Fourth Floor, Sector 67, Mohali -160062, Punjab, India

---
This is an automated message. Please do not reply to this email address.
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Connect to SMTP server and send email
            print(f"Attempting to send approval email to {registration['email']}")
            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            text = msg.as_string()
            server.sendmail(SMTP_USERNAME, registration['email'], text)
            server.quit()
            
            print(f"Approval email sent successfully to {registration['email']}")
            
        except Exception as email_error:
            print(f"Approval email sending failed: {email_error}")
            print(f"Email error type: {type(email_error).__name__}")
            # Still return success since the database operations succeeded
        
        return jsonify({
            'success': True,
            'message': 'Vendor registration approved successfully. Login credentials have been sent via email.'
        })
        
    except Exception as e:
        print(f"Approve vendor registration error: {e}")
        return jsonify({'error': 'Failed to approve vendor registration'}), 500

@app.route('/api/admin/vendor-registrations/<int:registration_id>/decline', methods=['POST'])
def decline_vendor_registration(registration_id):
    """Decline a vendor registration"""
    try:
        # Get registration details
        query = "SELECT * FROM vendor_registrations WHERE id = %s"
        registration = execute_query(query, (registration_id,), fetch_one=True)
        
        if not registration:
            return jsonify({'success': False, 'message': 'Registration not found'}), 404
        
        if registration['status'] != 'pending':
            return jsonify({'success': False, 'message': 'Registration is not pending'}), 400
        
        # Update registration status
        update_query = "UPDATE vendor_registrations SET status = 'declined', updated_at = NOW() WHERE id = %s"
        execute_query(update_query, (registration_id,))
        
        return jsonify({
            'success': True,
            'message': 'Vendor registration declined'
        })
        
    except Exception as e:
        print(f"Decline vendor registration error: {e}")
        return jsonify({'error': 'Failed to decline vendor registration'}), 500

@app.route('/api/vendor/dashboard-data', methods=['GET'])
def get_vendor_dashboard_data():
    """Get vendor dashboard data"""
    try:
        # For now, return mock data
        return jsonify({
            'success': True,
            'ndaStatus': 'completed',
            'registrationStatus': 'pending'
        })
        
    except Exception as e:
        print(f"Get vendor dashboard data error: {e}")
        return jsonify({'error': 'Failed to get vendor dashboard data'}), 500

# Organization Management API endpoints
@app.route('/api/admin/employees', methods=['GET'])
def get_all_employees():
    """Get all employees with their details"""
    try:
        query = """
        SELECT id, name, email, employee_id, designation, department, manager, 
               phone, address, hire_date, salary, emergency_contact, status, 
               created_at, updated_at
        FROM users 
        WHERE user_type = 'employee'
        ORDER BY name
        """
        employees = execute_query(query, fetch_all=True)
        
        # Convert to list of dictionaries
        employee_list = []
        for emp in employees:
            employee_dict = {
                'id': emp['id'],
                'name': emp['name'],
                'email': emp['email'],
                'employeeId': emp['employee_id'],
                'position': emp['designation'],
                'department': emp['department'],
                'manager': emp['manager'],
                'phone': emp.get('phone', ''),
                'address': emp.get('address', ''),
                'hireDate': emp.get('hire_date', ''),
                'salary': emp.get('salary', ''),
                'emergencyContact': emp.get('emergency_contact', ''),
                'status': emp.get('status', 'active'),
                'submitted_at': emp['created_at'],
                'avatar': _generate_avatar(emp['name'])
            }
            employee_list.append(employee_dict)
        
        return jsonify(employee_list)
        
    except Exception as e:
        print(f"Get all employees error: {e}")
        return jsonify({'error': 'Failed to get employees'}), 500

@app.route('/api/admin/employees', methods=['POST'])
def create_employee():
    """Create a new employee"""
    try:
        data = request.get_json()
        
        # Extract employee data
        name = data.get('name')
        email = data.get('email')
        employee_id = data.get('employeeId')
        position = data.get('position')
        department = data.get('department')
        manager = data.get('manager')
        phone = data.get('phone', '')
        address = data.get('address', '')
        hire_date = data.get('hireDate')
        salary = data.get('salary', '')
        emergency_contact = data.get('emergencyContact', '')
        password = data.get('password', 'temp123')  # Default password
        
        # Validate required fields
        if not all([name, email, employee_id, position, department]):
            return jsonify({'success': False, 'message': 'Name, email, employee ID, position, and department are required'}), 400
        
        # Check if employee already exists
        query = "SELECT id FROM users WHERE email = %s OR employee_id = %s"
        existing = execute_query(query, (email, employee_id), fetch_one=True)
        if existing:
            return jsonify({'success': False, 'message': 'Employee with this email or employee ID already exists'}), 400
        
        # Hash password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Insert employee
        query = """
        INSERT INTO users (email, password_hash, name, employee_id, designation, department, 
                          manager, phone, address, hire_date, salary, emergency_contact, 
                          status, user_type, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'active', 'employee', NOW())
        """
        
        execute_query(query, (email, password_hash, name, employee_id, position, department,
                             manager, phone, address, hire_date, salary, emergency_contact))
        
        return jsonify({'success': True, 'message': 'Employee created successfully'})
        
    except Exception as e:
        print(f"Create employee error: {e}")
        return jsonify({'success': False, 'message': 'Failed to create employee'}), 500

@app.route('/api/admin/employees/<int:employee_id>', methods=['PUT'])
def update_employee(employee_id):
    """Update an employee"""
    try:
        data = request.get_json()
        
        # Extract update data
        name = data.get('name')
        email = data.get('email')
        employee_id_new = data.get('employeeId')
        position = data.get('position')
        department = data.get('department')
        manager = data.get('manager')
        phone = data.get('phone', '')
        address = data.get('address', '')
        hire_date = data.get('hireDate')
        salary = data.get('salary', '')
        emergency_contact = data.get('emergencyContact', '')
        status = data.get('status', 'active')
        
        # Validate required fields
        if not all([name, email, employee_id_new, position, department]):
            return jsonify({'success': False, 'message': 'Name, email, employee ID, position, and department are required'}), 400
        
        # Check if email or employee_id is taken by another employee
        query = "SELECT id FROM users WHERE (email = %s OR employee_id = %s) AND id != %s"
        existing = execute_query(query, (email, employee_id_new, employee_id), fetch_one=True)
        if existing:
            return jsonify({'success': False, 'message': 'Email or employee ID already exists for another employee'}), 400
        
        # Update employee
        query = """
        UPDATE users 
        SET name = %s, email = %s, employee_id = %s, designation = %s, department = %s,
            manager = %s, phone = %s, address = %s, hire_date = %s, salary = %s,
            emergency_contact = %s, status = %s, updated_at = NOW()
        WHERE id = %s AND user_type = 'employee'
        """
        
        execute_query(query, (name, email, employee_id_new, position, department, manager,
                             phone, address, hire_date, salary, emergency_contact, status, employee_id))
        
        return jsonify({'success': True, 'message': 'Employee updated successfully'})
        
    except Exception as e:
        print(f"Update employee error: {e}")
        return jsonify({'success': False, 'message': 'Failed to update employee'}), 500

@app.route('/api/admin/employees/<int:employee_id>', methods=['DELETE'])
def delete_employee(employee_id):
    """Delete an employee"""
    try:
        # Check if employee exists
        query = "SELECT id FROM users WHERE id = %s AND user_type = 'employee'"
        employee = execute_query(query, (employee_id,), fetch_one=True)
        if not employee:
            return jsonify({'success': False, 'message': 'Employee not found'}), 404
        
        # Delete employee
        query = "DELETE FROM users WHERE id = %s AND user_type = 'employee'"
        execute_query(query, (employee_id,))
        
        return jsonify({'success': True, 'message': 'Employee deleted successfully'})
        
    except Exception as e:
        print(f"Delete employee error: {e}")
        return jsonify({'success': False, 'message': 'Failed to delete employee'}), 500

@app.route('/api/admin/departments', methods=['GET'])
def get_all_departments():
    """Get all departments"""
    try:
        # Get all departments from departments table
        query = """
        SELECT d.id, d.name, d.description, d.head_id, d.budget, d.location, d.established_date,
               COALESCE(emp_count.employee_count, 0) as employee_count
        FROM departments d
        LEFT JOIN (
            SELECT department, COUNT(*) as employee_count
            FROM users 
            WHERE user_type = 'employee' AND department IS NOT NULL AND department != ''
            GROUP BY department
        ) emp_count ON d.name = emp_count.department
        ORDER BY d.name
        """
        departments = execute_query(query, fetch_all=True)
        
        # Convert to list of dictionaries
        dept_list = []
        for dept in departments:
            dept_dict = {
                'id': dept['id'],
                'name': dept['name'],
                'employeeCount': dept['employee_count'],
                'description': dept['description'] or f"{dept['name']} Department",
                'head': dept['head_id'],
                'budget': dept['budget'] or '',
                'location': dept['location'] or '',
                'establishedDate': dept['established_date'] or ''
            }
            dept_list.append(dept_dict)
        
        return jsonify(dept_list)
        
    except Exception as e:
        print(f"Get departments error: {e}")
        return jsonify({'error': 'Failed to get departments'}), 500

@app.route('/api/admin/organization-stats', methods=['GET'])
def get_organization_stats():
    """Get organization statistics"""
    try:
        # Total employees
        query = "SELECT COUNT(*) as total FROM users WHERE user_type = 'employee'"
        total_employees = execute_query(query, fetch_one=True)['total']
        
        # Active employees
        query = "SELECT COUNT(*) as active FROM users WHERE user_type = 'employee' AND status = 'active'"
        active_employees = execute_query(query, fetch_one=True)['active']
        
        # Departments
        query = "SELECT COUNT(DISTINCT department) as dept_count FROM users WHERE user_type = 'employee' AND department IS NOT NULL"
        departments = execute_query(query, fetch_one=True)['dept_count']
        
        # Managers (employees with 'manager' in their designation)
        query = "SELECT COUNT(*) as managers FROM users WHERE user_type = 'employee' AND designation LIKE '%manager%'"
        managers = execute_query(query, fetch_one=True)['managers']
        
        return jsonify({
            'totalEmployees': total_employees,
            'activeEmployees': active_employees,
            'departments': departments,
            'managers': managers
        })
        
    except Exception as e:
        print(f"Get organization stats error: {e}")
        return jsonify({'error': 'Failed to get organization stats'}), 500

# Task Management API Endpoints
@app.route('/api/admin/tasks', methods=['GET'])
def get_tasks():
    """Get all tasks"""
    try:
        query = """
        SELECT t.*, 
               CASE 
                   WHEN t.assigned_to_type = 'employee' THEN u.name
                   WHEN t.assigned_to_type = 'vendor' THEN v.company_name
                   ELSE 'Unassigned'
               END as assigned_to_name,
               CASE 
                   WHEN t.assigned_to_type = 'employee' THEN u.email
                   WHEN t.assigned_to_type = 'vendor' THEN v.email
                   ELSE NULL
               END as assigned_to_email
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to_type = 'employee' AND t.assigned_to_id = u.id
        LEFT JOIN vendors v ON t.assigned_to_type = 'vendor' AND t.assigned_to_id = v.id
        ORDER BY t.created_at DESC
        """
        tasks = execute_query(query, fetch_all=True)
        return jsonify(tasks)
    except Exception as e:
        print(f"Get tasks error: {e}")
        return jsonify({'error': 'Failed to get tasks'}), 500

@app.route('/api/admin/tasks', methods=['POST'])
def create_task():
    """Create a new task"""
    try:
        data = request.get_json()
        
        title = data.get('title')
        description = data.get('description', '')
        priority = data.get('priority', 'medium')
        status = data.get('status', 'pending')
        assigned_to_type = data.get('assigned_to_type')
        assigned_to_id = data.get('assigned_to_id')
        salary_code = data.get('salary_code', '')
        due_date = data.get('due_date')
        created_by = data.get('created_by', 1)  # Default to System Administrator (valid user ID)
        
        if not title:
            return jsonify({'error': 'Task title is required'}), 400
        
        # Map priority values to match database enum for tasks
        priority_mapping = {
            'low': 'Low',
            'medium': 'Medium', 
            'high': 'High',
            'urgent': 'Critical'
        }
        db_priority = priority_mapping.get(priority.lower(), 'Medium')
        
        query = """
        INSERT INTO tasks (title, description, priority, status, assigned_to_type, assigned_to_id, assigned_to, due_date, salary_code, created_by, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """
        
        # Use assigned_to_id for the old assigned_to field to satisfy foreign key constraint
        assigned_to = assigned_to_id if assigned_to_type == 'employee' else None
        
        execute_query(query, (title, description, db_priority, status, assigned_to_type, assigned_to_id, assigned_to, due_date, salary_code, created_by))
        
        return jsonify({'success': True, 'message': 'Task created successfully'})
        
    except Exception as e:
        print(f"Create task error: {e}")
        return jsonify({'error': 'Failed to create task'}), 500

@app.route('/api/admin/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Update a task"""
    try:
        data = request.get_json()
        
        title = data.get('title')
        description = data.get('description', '')
        priority = data.get('priority', 'medium')
        status = data.get('status', 'pending')
        assigned_to_type = data.get('assigned_to_type')
        assigned_to_id = data.get('assigned_to_id')
        salary_code = data.get('salary_code', '')
        due_date = data.get('due_date')
        
        if not title:
            return jsonify({'error': 'Task title is required'}), 400
        
        # Map priority values to match database enum for tasks
        priority_mapping = {
            'low': 'Low',
            'medium': 'Medium', 
            'high': 'High',
            'urgent': 'Critical'
        }
        db_priority = priority_mapping.get(priority.lower(), 'Medium')
        
        query = """
        UPDATE tasks 
        SET title = %s, description = %s, priority = %s, status = %s, 
            assigned_to_type = %s, assigned_to_id = %s, due_date = %s, salary_code = %s, updated_at = NOW()
        WHERE id = %s
        """
        
        execute_query(query, (title, description, db_priority, status, assigned_to_type, assigned_to_id, due_date, salary_code, task_id))
        
        return jsonify({'success': True, 'message': 'Task updated successfully'})
        
    except Exception as e:
        print(f"Update task error: {e}")
        return jsonify({'error': 'Failed to update task'}), 500

@app.route('/api/admin/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a task"""
    try:
        query = "DELETE FROM tasks WHERE id = %s"
        execute_query(query, (task_id,))
        
        return jsonify({'success': True, 'message': 'Task deleted successfully'})
        
    except Exception as e:
        print(f"Delete task error: {e}")
        return jsonify({'error': 'Failed to delete task'}), 500

# Project Management API Endpoints
@app.route('/api/admin/projects', methods=['GET'])
def get_projects():
    """Get all projects"""
    try:
        query = """
        SELECT p.*, 
               CASE 
                   WHEN p.assigned_to_type = 'employee' THEN u.name
                   WHEN p.assigned_to_type = 'vendor' THEN v.company_name
                   ELSE 'Unassigned'
               END as assigned_to_name,
               CASE 
                   WHEN p.assigned_to_type = 'employee' THEN u.email
                   WHEN p.assigned_to_type = 'vendor' THEN v.email
                   ELSE NULL
               END as assigned_to_email
        FROM projects p
        LEFT JOIN users u ON p.assigned_to_type = 'employee' AND p.assigned_to_id = u.id
        LEFT JOIN vendors v ON p.assigned_to_type = 'vendor' AND p.assigned_to_id = v.id
        ORDER BY p.created_at DESC
        """
        projects = execute_query(query, fetch_all=True)
        return jsonify(projects)
    except Exception as e:
        print(f"Get projects error: {e}")
        return jsonify({'error': 'Failed to get projects'}), 500

@app.route('/api/admin/projects', methods=['POST'])
def create_project():
    """Create a new project"""
    try:
        data = request.get_json()
        
        name = data.get('name')
        description = data.get('description', '')
        status = data.get('status', 'planning')
        priority = data.get('priority', 'medium')
        assigned_to_type = data.get('assigned_to_type')
        assigned_to_id = data.get('assigned_to_id')
        salary_code = data.get('salary_code', '')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        budget = data.get('budget', '')
        created_by = data.get('created_by', 1)  # Default to System Administrator (valid user ID)
        
        if not name:
            return jsonify({'error': 'Project name is required'}), 400
        
        # Map priority values to match database enum for projects (lowercase)
        priority_mapping = {
            'low': 'low',
            'medium': 'medium', 
            'high': 'high',
            'urgent': 'urgent'
        }
        db_priority = priority_mapping.get(priority.lower(), 'medium')
        
        query = """
        INSERT INTO projects (name, description, status, priority, assigned_to_type, assigned_to_id, project_manager, start_date, end_date, budget, salary_code, created_by, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """
        
        # Use assigned_to_id for the old project_manager field to satisfy foreign key constraint
        project_manager = assigned_to_id if assigned_to_type == 'employee' else None
        
        execute_query(query, (name, description, status, db_priority, assigned_to_type, assigned_to_id, project_manager, start_date, end_date, budget, salary_code, created_by))
        
        return jsonify({'success': True, 'message': 'Project created successfully'})
        
    except Exception as e:
        print(f"Create project error: {e}")
        return jsonify({'error': 'Failed to create project'}), 500

@app.route('/api/admin/projects/<int:project_id>', methods=['PUT'])
def update_project(project_id):
    """Update a project"""
    try:
        data = request.get_json()
        
        name = data.get('name')
        description = data.get('description', '')
        status = data.get('status', 'planning')
        priority = data.get('priority', 'medium')
        assigned_to_type = data.get('assigned_to_type')
        assigned_to_id = data.get('assigned_to_id')
        salary_code = data.get('salary_code', '')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        budget = data.get('budget', '')
        
        if not name:
            return jsonify({'error': 'Project name is required'}), 400
        
        # Map priority values to match database enum for projects (lowercase)
        priority_mapping = {
            'low': 'low',
            'medium': 'medium', 
            'high': 'high',
            'urgent': 'urgent'
        }
        db_priority = priority_mapping.get(priority.lower(), 'medium')
        
        query = """
        UPDATE projects 
        SET name = %s, description = %s, status = %s, priority = %s, 
            assigned_to_type = %s, assigned_to_id = %s, start_date = %s, end_date = %s, budget = %s, salary_code = %s, updated_at = NOW()
        WHERE id = %s
        """
        
        execute_query(query, (name, description, status, db_priority, assigned_to_type, assigned_to_id, start_date, end_date, budget, salary_code, project_id))
        
        return jsonify({'success': True, 'message': 'Project updated successfully'})
        
    except Exception as e:
        print(f"Update project error: {e}")
        return jsonify({'error': 'Failed to update project'}), 500

@app.route('/api/admin/projects/<int:project_id>', methods=['DELETE'])
def delete_project(project_id):
    """Delete a project"""
    try:
        query = "DELETE FROM projects WHERE id = %s"
        execute_query(query, (project_id,))
        
        return jsonify({'success': True, 'message': 'Project deleted successfully'})
        
    except Exception as e:
        print(f"Delete project error: {e}")
        return jsonify({'error': 'Failed to delete project'}), 500

# Ticket Management API Endpoints
@app.route('/api/admin/tickets', methods=['GET'])
def get_tickets():
    """Get all tickets"""
    try:
        query = """
        SELECT t.*, 
               CASE 
                   WHEN t.assigned_to_type = 'employee' THEN u.name
                   WHEN t.assigned_to_type = 'vendor' THEN v.company_name
                   ELSE 'Unassigned'
               END as assigned_to_name,
               CASE 
                   WHEN t.assigned_to_type = 'employee' THEN u.email
                   WHEN t.assigned_to_type = 'vendor' THEN v.email
                   ELSE NULL
               END as assigned_to_email
        FROM tickets t
        LEFT JOIN users u ON t.assigned_to_type = 'employee' AND t.assigned_to_id = u.id
        LEFT JOIN vendors v ON t.assigned_to_type = 'vendor' AND t.assigned_to_id = v.id
        ORDER BY t.created_at DESC
        """
        tickets = execute_query(query, fetch_all=True)
        return jsonify(tickets)
    except Exception as e:
        print(f"Get tickets error: {e}")
        return jsonify({'error': 'Failed to get tickets'}), 500

@app.route('/api/admin/tickets', methods=['POST'])
def create_ticket():
    """Create a new ticket"""
    try:
        data = request.get_json()
        print(f"Received ticket creation data: {data}")
        
        title = data.get('title')
        description = data.get('description', '')
        category = data.get('category', 'general')
        priority = data.get('priority', 'medium')
        status = data.get('status', 'open')
        assigned_to_type = data.get('assigned_to_type')
        assigned_to_id = data.get('assigned_to_id')
        salary_code = data.get('salary_code', '')
        created_by = data.get('created_by')
        
        # If no created_by specified, get the first available user ID
        if not created_by:
            user_query = "SELECT MIN(id) FROM users"
            first_user = execute_query(user_query, fetch_one=True)
            created_by = first_user['MIN(id)'] if first_user and first_user['MIN(id)'] else None
        
        if not created_by:
            return jsonify({'error': 'No valid user found to assign as creator'}), 400
        
        if not title:
            return jsonify({'error': 'Ticket title is required'}), 400
        
        # Convert status and priority to match database enum values
        status_map = {
            'open': 'Open',
            'in_progress': 'In Progress', 
            'resolved': 'Resolved',
            'closed': 'Closed'
        }
        
        priority_map = {
            'low': 'Low',
            'medium': 'Medium',
            'high': 'High',
            'urgent': 'Critical'
        }
        
        db_status = status_map.get(status, 'Open')
        db_priority = priority_map.get(priority, 'Medium')
        
        query = """
        INSERT INTO tickets (title, description, category, priority, status, assigned_to_type, assigned_to_id, assigned_to, salary_code, created_by, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """
        
        # Use assigned_to_id for the old assigned_to field to satisfy foreign key constraint
        assigned_to = assigned_to_id if assigned_to_type == 'employee' else None
        
        print(f"Ticket creation values: assigned_to_type={assigned_to_type}, assigned_to_id={assigned_to_id}, assigned_to={assigned_to}, created_by={created_by}")
        
        execute_query(query, (title, description, category, db_priority, db_status, assigned_to_type, assigned_to_id, assigned_to, salary_code, created_by))
        
        return jsonify({'success': True, 'message': 'Ticket created successfully'})
        
    except Exception as e:
        print(f"Create ticket error: {e}")
        return jsonify({'error': 'Failed to create ticket'}), 500

@app.route('/api/admin/tickets/<int:ticket_id>', methods=['PUT'])
def update_ticket(ticket_id):
    """Update a ticket"""
    try:
        data = request.get_json()
        
        title = data.get('title')
        description = data.get('description', '')
        category = data.get('category', 'general')
        priority = data.get('priority', 'medium')
        status = data.get('status', 'open')
        assigned_to_type = data.get('assigned_to_type')
        assigned_to_id = data.get('assigned_to_id')
        salary_code = data.get('salary_code', '')
        
        if not title:
            return jsonify({'error': 'Ticket title is required'}), 400
        
        # Convert status and priority to match database enum values
        status_map = {
            'open': 'Open',
            'in_progress': 'In Progress', 
            'resolved': 'Resolved',
            'closed': 'Closed'
        }
        
        priority_map = {
            'low': 'Low',
            'medium': 'Medium',
            'high': 'High',
            'urgent': 'Critical'
        }
        
        db_status = status_map.get(status, 'Open')
        db_priority = priority_map.get(priority, 'Medium')
        
        query = """
        UPDATE tickets 
        SET title = %s, description = %s, category = %s, priority = %s, status = %s, 
            assigned_to_type = %s, assigned_to_id = %s, salary_code = %s, updated_at = NOW()
        WHERE id = %s
        """
        
        execute_query(query, (title, description, category, db_priority, db_status, assigned_to_type, assigned_to_id, salary_code, ticket_id))
        
        return jsonify({'success': True, 'message': 'Ticket updated successfully'})
        
    except Exception as e:
        print(f"Update ticket error: {e}")
        return jsonify({'error': 'Failed to update ticket'}), 500

@app.route('/api/admin/tickets/<int:ticket_id>', methods=['DELETE'])
def delete_ticket(ticket_id):
    """Delete a ticket"""
    try:
        query = "DELETE FROM tickets WHERE id = %s"
        execute_query(query, (ticket_id,))
        
        return jsonify({'success': True, 'message': 'Ticket deleted successfully'})
        
    except Exception as e:
        print(f"Delete ticket error: {e}")
        return jsonify({'error': 'Failed to delete ticket'}), 500

# Employee Notification and Update API Endpoints
@app.route('/api/employee/notifications', methods=['GET'])
def get_employee_notifications():
    """Get notifications for a specific employee"""
    try:
        # Get employee ID from session or request
        employee_id = request.args.get('employee_id')
        if not employee_id:
            return jsonify({'error': 'Employee ID required'}), 400
        
        # Get tasks assigned to employee
        tasks_query = """
        SELECT 'task' as type, id, title, description, priority, status, due_date, created_at
        FROM tasks 
        WHERE assigned_to_type = 'employee' AND assigned_to_id = %s
        ORDER BY created_at DESC
        """
        tasks = execute_query(tasks_query, (employee_id,), fetch_all=True)
        
        # Get projects assigned to employee
        projects_query = """
        SELECT 'project' as type, id, name as title, description, priority, status, start_date, end_date, created_at
        FROM projects 
        WHERE assigned_to_type = 'employee' AND assigned_to_id = %s
        ORDER BY created_at DESC
        """
        projects = execute_query(projects_query, (employee_id,), fetch_all=True)
        
        # Get tickets assigned to employee
        tickets_query = """
        SELECT 'ticket' as type, id, title, description, priority, status, category, created_at
        FROM tickets 
        WHERE assigned_to_type = 'employee' AND assigned_to_id = %s
        ORDER BY created_at DESC
        """
        tickets = execute_query(tickets_query, (employee_id,), fetch_all=True)
        
        # Get announcements
        announcements_query = """
        SELECT 'announcement' as type, id, title as title, message as description, priority, 'active' as status, created_at
        FROM announcements 
        WHERE (target_audience = 'all' OR target_audience = 'employees')
        AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY created_at DESC
        LIMIT 10
        """
        announcements = execute_query(announcements_query, fetch_all=True)
        
        # Get read status for all notifications
        read_status_query = """
        SELECT notification_type, notification_id, is_read, read_at
        FROM user_notifications 
        WHERE user_id = %s
        """
        read_statuses = execute_query(read_status_query, (employee_id,), fetch_all=True)
        
        # Create a map of read statuses
        read_map = {}
        if read_statuses:
            for status in read_statuses:
                key = f"{status['notification_type']}_{status['notification_id']}"
                read_map[key] = {
                    'is_read': status['is_read'],
                    'read_at': status['read_at']
                }
        
        # Combine all notifications
        notifications = []
        if tasks:
            for task in tasks:
                key = f"task_{task['id']}"
                notifications.append({
                    'id': f"task_{task['id']}",
                    'type': 'task',
                    'title': task['title'],
                    'message': task['description'],
                    'priority': task['priority'],
                    'status': task['status'],
                    'due_date': task['due_date'],
                    'created_at': task['created_at'],
                    'read': read_map.get(key, {}).get('is_read', False),
                    'read_at': read_map.get(key, {}).get('read_at')
                })
        
        if projects:
            for project in projects:
                key = f"project_{project['id']}"
                notifications.append({
                    'id': f"project_{project['id']}",
                    'type': 'project',
                    'title': project['title'],
                    'message': project['description'],
                    'priority': project['priority'],
                    'status': project['status'],
                    'due_date': project['end_date'],
                    'created_at': project['created_at'],
                    'read': read_map.get(key, {}).get('is_read', False),
                    'read_at': read_map.get(key, {}).get('read_at')
                })
        
        if tickets:
            for ticket in tickets:
                key = f"ticket_{ticket['id']}"
                notifications.append({
                    'id': f"ticket_{ticket['id']}",
                    'type': 'ticket',
                    'title': ticket['title'],
                    'message': ticket['description'],
                    'priority': ticket['priority'],
                    'status': ticket['status'],
                    'created_at': ticket['created_at'],
                    'read': read_map.get(key, {}).get('is_read', False),
                    'read_at': read_map.get(key, {}).get('read_at')
                })
        
        # Add announcements if they exist
        if announcements:
            for announcement in announcements:
                key = f"announcement_{announcement['id']}"
                notifications.append({
                    'id': f"announcement_{announcement['id']}",
                    'type': 'announcement',
                    'title': announcement['title'],
                    'message': announcement['description'],
                    'priority': announcement['priority'],
                    'status': announcement['status'],
                    'created_at': announcement['created_at'],
                    'read': read_map.get(key, {}).get('is_read', False),
                    'read_at': read_map.get(key, {}).get('read_at')
                })
        
        # Sort by creation date
        notifications.sort(key=lambda x: x['created_at'], reverse=True)
        
        return jsonify(notifications)
        
    except Exception as e:
        print(f"Get employee notifications error: {e}")
        return jsonify({'error': 'Failed to get notifications'}), 500

@app.route('/api/employee/tasks/<int:task_id>/update', methods=['PUT'])
def update_employee_task(task_id):
    """Allow employee to update their assigned task"""
    try:
        data = request.get_json()
        
        # Get employee ID from session or request
        employee_id = data.get('employee_id')
        if not employee_id:
            return jsonify({'error': 'Employee ID required'}), 400
        
        # Verify task is assigned to this employee
        verify_query = "SELECT * FROM tasks WHERE id = %s AND assigned_to_type = 'employee' AND assigned_to_id = %s"
        task = execute_query(verify_query, (task_id, employee_id), fetch_one=True)
        
        if not task:
            return jsonify({'error': 'Task not found or not assigned to employee'}), 404
        
        # Allow employee to update status and add comments
        status = data.get('status')
        comments = data.get('comments', '')
        
        if not status:
            return jsonify({'error': 'Status is required'}), 400
        
        # Map status values to match database enum for tasks
        status_mapping = {
            'pending': 'Pending',
            'in_progress': 'In Progress',
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        }
        db_status = status_mapping.get(status.lower(), status)
        
        # Update task
        update_query = """
        UPDATE tasks 
        SET status = %s, updated_at = NOW()
        WHERE id = %s
        """
        
        execute_query(update_query, (db_status, task_id))
        
        # Log the update (you could create a task_comments table for this)
        print(f"Employee {employee_id} updated task {task_id} to status: {status}")
        
        return jsonify({'success': True, 'message': 'Task updated successfully'})
        
    except Exception as e:
        print(f"Update employee task error: {e}")
        return jsonify({'error': 'Failed to update task'}), 500

@app.route('/api/employee/projects/<int:project_id>/update', methods=['PUT'])
def update_employee_project(project_id):
    """Allow employee to update their assigned project"""
    try:
        data = request.get_json()
        
        # Get employee ID from session or request
        employee_id = data.get('employee_id')
        if not employee_id:
            return jsonify({'error': 'Employee ID required'}), 400
        
        # Verify project is assigned to this employee
        verify_query = "SELECT * FROM projects WHERE id = %s AND assigned_to_type = 'employee' AND assigned_to_id = %s"
        project = execute_query(verify_query, (project_id, employee_id), fetch_one=True)
        
        if not project:
            return jsonify({'error': 'Project not found or not assigned to employee'}), 404
        
        # Allow employee to update status and add comments
        status = data.get('status')
        comments = data.get('comments', '')
        
        if not status:
            return jsonify({'error': 'Status is required'}), 400
        
        # Map status values to match database enum for projects
        status_mapping = {
            'planning': 'Planning',
            'active': 'Active',
            'in_progress': 'Active',  # Map in_progress to Active for projects
            'on_hold': 'On Hold',
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        }
        db_status = status_mapping.get(status.lower(), status)
        
        # Update project
        update_query = """
        UPDATE projects 
        SET status = %s, updated_at = NOW()
        WHERE id = %s
        """
        
        execute_query(update_query, (db_status, project_id))
        
        # Log the update
        print(f"Employee {employee_id} updated project {project_id} to status: {status}")
        
        return jsonify({'success': True, 'message': 'Project updated successfully'})
        
    except Exception as e:
        print(f"Update employee project error: {e}")
        return jsonify({'error': 'Failed to update project'}), 500

@app.route('/api/employee/tickets/<int:ticket_id>/update', methods=['PUT'])
def update_employee_ticket(ticket_id):
    """Allow employee to update their assigned ticket"""
    try:
        data = request.get_json()
        
        # Get employee ID from session or request
        employee_id = data.get('employee_id')
        if not employee_id:
            return jsonify({'error': 'Employee ID required'}), 400
        
        # Verify ticket is assigned to this employee
        verify_query = "SELECT * FROM tickets WHERE id = %s AND assigned_to_type = 'employee' AND assigned_to_id = %s"
        ticket = execute_query(verify_query, (ticket_id, employee_id), fetch_one=True)
        
        if not ticket:
            return jsonify({'error': 'Ticket not found or not assigned to employee'}), 404
        
        # Allow employee to update status and add comments
        status = data.get('status')
        comments = data.get('comments', '')
        
        if not status:
            return jsonify({'error': 'Status is required'}), 400
        
        # Map status values to match database enum for tickets
        status_mapping = {
            'open': 'Open',
            'in_progress': 'In Progress',
            'resolved': 'Resolved',
            'closed': 'Closed'
        }
        db_status = status_mapping.get(status.lower(), status)
        
        # Update ticket
        update_query = """
        UPDATE tickets 
        SET status = %s, updated_at = NOW()
        WHERE id = %s
        """
        
        execute_query(update_query, (db_status, ticket_id))
        
        # Log the update
        print(f"Employee {employee_id} updated ticket {ticket_id} to status: {status}")
        
        return jsonify({'success': True, 'message': 'Ticket updated successfully'})
        
    except Exception as e:
        print(f"Update employee ticket error: {e}")
        return jsonify({'error': 'Failed to update ticket'}), 500

@app.route('/api/employee/create-ticket', methods=['POST'])
def create_ticket_by_employee():
    """Allow employee to create a new ticket"""
    try:
        data = request.get_json()
        print(f"Received ticket creation request: {data}")
        
        employee_id = data.get('employee_id')
        title = data.get('title')
        description = data.get('description', '')
        category = data.get('category', 'general')
        priority = data.get('priority', 'medium')
        status = data.get('status', 'open')
        
        print(f"Parsed data - Employee ID: {employee_id}, Title: {title}, Priority: {priority}, Status: {status}")
        
        if not employee_id or not title:
            print("Error: Missing required fields")
            return jsonify({'error': 'Employee ID and title are required'}), 400
        
        # Verify employee exists
        verify_query = "SELECT id FROM users WHERE id = %s AND user_type = 'employee'"
        employee = execute_query(verify_query, (employee_id,), fetch_one=True)
        if not employee:
            return jsonify({'error': 'Employee not found'}), 404
        
        # Create ticket
        insert_query = """
            INSERT INTO tickets (title, description, priority, status, assigned_to_type, assigned_to_id, assigned_to, created_by, created_at)
            VALUES (%s, %s, %s, %s, 'employee', %s, %s, %s, CURRENT_TIMESTAMP)
        """
        
        # Convert status and priority to match database enum values
        status_map = {
            'open': 'Open',
            'in_progress': 'In Progress', 
            'resolved': 'Resolved',
            'closed': 'Closed'
        }
        
        priority_map = {
            'low': 'Low',
            'medium': 'Medium',
            'high': 'High',
            'urgent': 'Critical'
        }
        
        db_status = status_map.get(status, 'Open')
        db_priority = priority_map.get(priority, 'Medium')
        
        print(f"Database values - Status: {db_status}, Priority: {db_priority}")
        print(f"About to execute query: {insert_query}")
        print(f"With parameters: {title}, {description}, {db_priority}, {db_status}, {employee_id}, {employee_id}, {employee_id}")
        
        execute_query(insert_query, (title, description, db_priority, db_status, employee_id, employee_id, employee_id))
        
        print("Query executed successfully")
        
        # Get the ticket ID
        ticket_query = "SELECT LAST_INSERT_ID() as ticket_id"
        result = execute_query(ticket_query, fetch_one=True)
        ticket_id = result['ticket_id']
        
        print(f"Ticket created with ID: {ticket_id}")
        
        print(f"Employee {employee_id} created ticket {ticket_id}: {title}")
        
        return jsonify({
            'message': 'Ticket created successfully',
            'ticket_id': ticket_id
        })
        
    except Exception as e:
        print(f"Create ticket error: {e}")
        return jsonify({'error': 'Failed to create ticket'}), 500

# Workflow routes
@app.route('/api/workflows', methods=['GET'])
def get_workflows():
    try:
        workflows = get_workflows_data()
        return jsonify(workflows)
    except Exception as e:
        print(f"Get workflows error: {e}")
        return jsonify({'error': 'Failed to get workflows'}), 500

@app.route('/api/workflows', methods=['POST'])
def create_workflow():
    try:
        data = request.get_json()
        workflow = save_workflow(data)
        if workflow:
            return jsonify(workflow), 201
        else:
            return jsonify({'error': 'Failed to create workflow'}), 500
    except Exception as e:
        print(f"Create workflow error: {e}")
        return jsonify({'error': 'Failed to create workflow'}), 500

# User routes
@app.route('/api/employees/<int:employee_id>', methods=['GET'])
def get_employee(employee_id):
    try:
        query = "SELECT * FROM users WHERE id = %s AND user_type = 'employee'"
        employee = execute_query(query, (employee_id,), fetch_one=True)
        
        if not employee:
            return jsonify({'error': 'Employee not found'}), 404
        
        return jsonify(employee)
    except Exception as e:
        print(f"Get employee error: {e}")
        return jsonify({'error': 'Failed to get employee'}), 500

# Admin routes
@app.route('/api/admin/vendors', methods=['GET'])
def get_admin_vendors():
    try:
        vendors = get_vendors_data()
        # Safety check to prevent NoneType errors
        if vendors is None:
            print("⚠️ Vendors returned None - database connection issue")
            vendors = []
        return jsonify(vendors)
    except Exception as e:
        print(f"Get vendors error: {e}")
        return jsonify({'error': 'Failed to get vendors'}), 500

@app.route('/api/admin/submitted-nda-forms', methods=['GET'])
def get_submitted_nda_forms():
    try:
        nda_requests = get_nda_requests_data()
        # Safety check to prevent NoneType errors
        if nda_requests is None:
            print("⚠️ NDA requests returned None - database connection issue")
            nda_requests = []
        return jsonify(nda_requests)
    except Exception as e:
        print(f"Get NDA forms error: {e}")
        return jsonify({'error': 'Failed to get NDA forms'}), 500

@app.route('/api/admin/send-nda', methods=['POST'])
def send_nda():
    try:
        data = request.get_json()
        email = data.get('email')
        company_name = data.get('company_name')
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        # Generate unique reference number
        reference_number = generate_reference_number()
        
        # Check if vendor already exists
        check_query = "SELECT id FROM vendors WHERE email = %s"
        existing_vendor = execute_query(check_query, (email,), fetch_one=True)
        
        if existing_vendor:
            # Update existing vendor
            query = """
            UPDATE vendors SET company_name = %s, reference_number = %s, updated_at = %s
            WHERE email = %s
            """
            execute_query(query, (company_name, reference_number, datetime.now(), email))
        else:
            # Insert new vendor
            query = """
            INSERT INTO vendors (email, company_name, nda_status, reference_number, created_at)
            VALUES (%s, %s, %s, %s, %s)
            """
            execute_query(query, (email, company_name, 'sent', reference_number, datetime.now()))
        
        # Send email with NDA form
        try:
            msg = MIMEMultipart()
            msg['From'] = SMTP_USERNAME
            msg['To'] = email
            msg['Subject'] = f"NDA Agreement Request - {company_name} (Ref: {reference_number})"
            
            # Email body
            body = f"""
Dear Sir/Madam,

Subject: Invitation to Complete Non-Disclosure Agreement - Strategic Partnership Opportunity

We hope this correspondence finds you in good health and prosperity.

YellowStone Xperiences Pvt Ltd is pleased to extend an invitation to {company_name} to participate in our Strategic Partnership Program. As part of our commitment to maintaining the highest standards of confidentiality and professional conduct, we require all potential partners to complete a formal Non-Disclosure Agreement (NDA) prior to proceeding with any business discussions.

REFERENCE NUMBER: {reference_number}

To facilitate this process, we have prepared a comprehensive NDA form that can be completed electronically through our secure portal. Please follow the link provided below to access and complete the required documentation:

PORTAL LINK: https://yellowstonexperiences.com/vendor_portal/?ref={reference_number}

IMPORTANT INSTRUCTIONS:
- Please complete all required fields accurately
- Ensure all company information is current and verified
- Digital signature is required for document execution
- Company stamp upload is optional but recommended

Upon successful completion and verification of the NDA, your organization will receive portal access credentials and be eligible to participate in our Strategic Partnership Program.

Should you have any questions or require assistance during the completion process, please do not hesitate to contact our Vendor Relations Department.

We appreciate your cooperation and look forward to establishing a mutually beneficial partnership.

Yours faithfully,

Harpreet Singh
CEO
YellowStone Xperiences Pvt Ltd
Email: Harpreet.singh@yellowstonexps.com
Phone: [Contact Number]
Address: Plot # 2, ITC, Fourth Floor, Sector 67, Mohali -160062, Punjab, India

---
This is an automated message. Please do not reply to this email address.
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Connect to SMTP server and send email
            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            text = msg.as_string()
            server.sendmail(SMTP_USERNAME, email, text)
            server.quit()
            
            print(f"NDA email sent successfully to {email} with reference {reference_number}")
            
        except Exception as email_error:
            print(f"Email sending failed: {email_error}")
            # Still return success since the database operation succeeded
            return jsonify({'success': True, 'message': 'NDA recorded but email delivery failed', 'reference_number': reference_number})
        
        return jsonify({'success': True, 'message': 'NDA sent successfully', 'reference_number': reference_number})
    except Exception as e:
        print(f"Send NDA error: {e}")
        return jsonify({'error': 'Failed to send NDA'}), 500

def send_nda_email(email, company_name, contact_person, reference_number):
    """Send NDA email to vendor"""
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USERNAME
        msg['To'] = email
        msg['Subject'] = f"NDA Agreement - {company_name} ({reference_number})"
        
        # Email body
        body = f"""
Dear {contact_person},

Subject: Non-Disclosure Agreement (NDA) - Action Required

We hope this correspondence finds you well.

We are pleased to extend an invitation for your company, {company_name}, to enter into a Non-Disclosure Agreement with YellowStone Xperiences Pvt Ltd. This agreement will facilitate our discussions regarding potential strategic partnerships and business collaborations.

AGREEMENT DETAILS:
Reference Number: {reference_number}
Company: {company_name}
Agreement Type: Mutual Non-Disclosure Agreement
Validity Period: 5 years from execution date

NEXT STEPS:
1. Please review the attached NDA agreement carefully
2. Complete the required information and signatures
3. Submit the executed agreement through our portal
4. Our legal team will review and provide final approval

IMPORTANT INFORMATION:
- This agreement protects confidential information shared between both parties
- All discussions and materials shared will remain strictly confidential
- The agreement is legally binding and enforceable under Indian law
- Please ensure all required fields are completed accurately

Should you have any questions or require clarification regarding this agreement, please do not hesitate to contact our legal department.

We look forward to a successful and mutually beneficial partnership.

Yours sincerely,

Harpreet Singh
CEO
YellowStone Xperiences Pvt Ltd
Email: Harpreet.singh@yellowstonexps.com
Phone: [Contact Number]
Address: Plot # 2, ITC, Fourth Floor, Sector 67, Mohali -160062, Punjab, India

---
This is an automated message. Please do not reply to this email address.
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Connect to SMTP server and send email
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(SMTP_USERNAME, email, text)
        server.quit()
        
        print(f"NDA email sent successfully to {email}")
        
    except Exception as email_error:
        print(f"NDA email sending failed: {email_error}")
        raise email_error

@app.route('/api/admin/send-bulk-nda', methods=['POST'])
def send_bulk_nda():
    try:
        data = request.get_json()
        selected_vendors = data.get('selected_vendors', [])  # Array of vendor IDs
        new_vendors = data.get('new_vendors', [])  # Array of new vendor objects
        
        results = {
            'successful': [],
            'failed': [],
            'total_sent': 0
        }
        
        # Send NDAs to existing selected vendors
        for vendor_id in selected_vendors:
            try:
                # Get vendor details
                query = "SELECT * FROM vendors WHERE id = %s"
                vendor = execute_query(query, (vendor_id,), fetch_one=True)
                
                if vendor:
                    # Generate new reference number for this NDA
                    reference_number = f"NDA-{datetime.now().strftime('%Y')}-{''.join(random.choices(string.ascii_uppercase + string.digits, k=6))}"
                    
                    # Update vendor with new reference number and reset status
                    update_query = """
                    UPDATE vendors 
                    SET reference_number = %s, nda_status = 'sent', updated_at = %s
                    WHERE id = %s
                    """
                    execute_query(update_query, (reference_number, datetime.now(), vendor_id))
                    
                    # Send NDA email
                    send_nda_email(vendor['email'], vendor['company_name'], vendor['contact_person'], reference_number)
                    
                    results['successful'].append({
                        'vendor_id': vendor_id,
                        'company_name': vendor['company_name'],
                        'email': vendor['email'],
                        'reference_number': reference_number
                    })
                    results['total_sent'] += 1
                    
            except Exception as e:
                print(f"Failed to send NDA to vendor {vendor_id}: {e}")
                results['failed'].append({
                    'vendor_id': vendor_id,
                    'error': str(e)
                })
        
        # Add and send NDAs to new vendors
        for new_vendor in new_vendors:
            try:
                company_name = new_vendor.get('company_name')
                contact_person = new_vendor.get('contact_person')
                email = new_vendor.get('email')
                
                if not all([company_name, contact_person, email]):
                    results['failed'].append({
                        'new_vendor': new_vendor,
                        'error': 'Missing required fields'
                    })
                    continue
                
                # Generate unique reference number
                reference_number = f"NDA-{datetime.now().strftime('%Y')}-{''.join(random.choices(string.ascii_uppercase + string.digits, k=6))}"
                
                # Store vendor information
                query = """
                INSERT INTO vendors (company_name, contact_person, email, reference_number, nda_status, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """
                execute_query(query, (
                    company_name, contact_person, email, reference_number, 'sent', 
                    datetime.now(), datetime.now()
                ))
                
                # Send NDA email
                send_nda_email(email, company_name, contact_person, reference_number)
                
                results['successful'].append({
                    'company_name': company_name,
                    'email': email,
                    'reference_number': reference_number,
                    'is_new': True
                })
                results['total_sent'] += 1
                
            except Exception as e:
                print(f"Failed to add/send NDA to new vendor {new_vendor}: {e}")
                results['failed'].append({
                    'new_vendor': new_vendor,
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'message': f'Bulk NDA sending completed. {results["total_sent"]} NDAs sent successfully.',
            'results': results
        })
        
    except Exception as e:
        print(f"Bulk send NDA error: {e}")
        return jsonify({'success': False, 'error': 'Failed to send bulk NDAs'}), 500

@app.route('/api/admin/notifications', methods=['GET'])
def get_admin_notifications():
    """Get notifications for admin dashboard"""
    try:
        # Get recent vendor activities as notifications
        query = """
        SELECT 
            'vendor_nda_submitted' as type,
            ('NDA Submitted by ' || COALESCE(company_name, 'Unknown Company')) as title,
            ('New NDA form submitted by ' || COALESCE(company_name, 'Unknown Company') || ' (' || COALESCE(contact_person, 'Unknown Contact') || ')') as message,
            created_at,
            id as reference_id
        FROM vendors 
        WHERE nda_status = 'completed' 
        AND created_at >= NOW() - INTERVAL '30 days'
        
        UNION ALL
        
        SELECT 
            'vendor_approved' as type,
            ('Vendor Approved: ' || COALESCE(company_name, 'Unknown Company')) as title,
            ('Portal access granted to ' || COALESCE(company_name, 'Unknown Company')) as message,
            updated_at as created_at,
            id as reference_id
        FROM vendors 
        WHERE nda_status = 'approved' 
        AND updated_at >= NOW() - INTERVAL '30 days'
        
        ORDER BY created_at DESC
        LIMIT 50
        """
        
        notifications = execute_query(query, fetch_all=True)
        
        # Handle case where query returns None
        if notifications is None:
            print("⚠️ Notifications query returned None - checking for query errors")
            # Try a simpler query to test connection
            test_query = "SELECT COUNT(*) FROM vendors"
            test_result = execute_query(test_query, fetch_one=True)
            if test_result is None:
                print("❌ Basic vendors query also failed - database connection issue")
            else:
                print(f"✅ Basic vendors query works - found {test_result['count']} vendors")
            notifications = []
        
        return jsonify({
            'success': True,
            'notifications': notifications
        })
        
    except Exception as e:
        print(f"Get notifications error: {e}")
        return jsonify({'success': False, 'notifications': []}), 500

# Announcements API Endpoints
@app.route('/api/admin/announcements', methods=['GET'])
def get_announcements():
    """Get all announcements"""
    try:
        query = """
        SELECT id, title, message, priority, target_audience, created_by, created_at, expires_at
        FROM announcements 
        WHERE (expires_at IS NULL OR expires_at > NOW())
        ORDER BY created_at DESC
        """
        announcements = execute_query(query, fetch_all=True)
        return jsonify(announcements)
    except Exception as e:
        print(f"Get announcements error: {e}")
        return jsonify({'error': 'Failed to get announcements'}), 500

@app.route('/api/admin/announcements', methods=['POST'])
def create_announcement():
    """Create a new announcement"""
    try:
        data = request.get_json()
        
        title = data.get('title')
        message = data.get('message')
        priority = data.get('priority', 'medium')
        target_audience = data.get('target_audience', 'all')
        expires_at = data.get('expires_at')
        created_by = data.get('created_by', 1)
        
        if not title or not message:
            return jsonify({'error': 'Title and message are required'}), 400
        
        query = """
        INSERT INTO announcements (title, message, priority, target_audience, created_by, created_at, expires_at)
        VALUES (%s, %s, %s, %s, %s, NOW(), %s)
        """
        
        execute_query(query, (title, message, priority, target_audience, created_by, expires_at))
        
        # Create notifications for all employees
        if target_audience in ['all', 'employees']:
            employees_query = "SELECT id FROM users WHERE user_type = 'employee'"
            employees = execute_query(employees_query, fetch_all=True)
            
            for employee in employees:
                notification_query = """
                INSERT INTO employee_notifications (employee_id, title, message, type, created_at)
                VALUES (%s, %s, %s, 'announcement', NOW())
                """
                execute_query(notification_query, (employee['id'], title, message))
        
        return jsonify({'success': True, 'message': 'Announcement created successfully'})
        
    except Exception as e:
        print(f"Create announcement error: {e}")
        return jsonify({'error': 'Failed to create announcement'}), 500

@app.route('/api/employee/announcements', methods=['GET'])
def get_employee_announcements():
    """Get announcements for employees"""
    try:
        employee_id = request.args.get('employee_id')
        if not employee_id:
            return jsonify({'error': 'Employee ID required'}), 400
        
        query = """
        SELECT id, title, message, priority, created_at, expires_at
        FROM announcements 
        WHERE (target_audience = 'all' OR target_audience = 'employees')
        AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY created_at DESC
        LIMIT 20
        """
        announcements = execute_query(query, fetch_all=True)
        return jsonify(announcements)
    except Exception as e:
        print(f"Get employee announcements error: {e}")
        return jsonify({'error': 'Failed to get announcements'}), 500

@app.route('/api/employee/task-updates', methods=['POST'])
def submit_task_update():
    """Allow employee to submit updates for assigned tasks"""
    try:
        data = request.get_json()
        
        task_id = data.get('task_id')
        employee_id = data.get('employee_id')
        update_message = data.get('update_message')
        progress_percentage = data.get('progress_percentage', 0)
        status = data.get('status')
        
        if not task_id or not employee_id or not update_message:
            return jsonify({'error': 'Task ID, Employee ID, and update message are required'}), 400
        
        # Verify the task is assigned to this employee
        verify_query = """
        SELECT id FROM tasks 
        WHERE id = %s AND assigned_to_type = 'employee' AND assigned_to_id = %s
        """
        task_exists = execute_query(verify_query, (task_id, employee_id), fetch_one=True)
        
        if not task_exists:
            return jsonify({'error': 'Task not found or not assigned to this employee'}), 404
        
        # Insert the update
        insert_query = """
        INSERT INTO task_updates (task_id, employee_id, update_message, progress_percentage, status, created_at)
        VALUES (%s, %s, %s, %s, %s, NOW())
        """
        
        execute_query(insert_query, (task_id, employee_id, update_message, progress_percentage, status))
        
        # Update task status if provided
        if status:
            # Map status values to match database enum for tasks
            status_mapping = {
                'pending': 'Pending',
                'in_progress': 'In Progress',
                'completed': 'Completed',
                'cancelled': 'Cancelled'
            }
            db_status = status_mapping.get(status.lower(), status)
            update_task_query = "UPDATE tasks SET status = %s, updated_at = NOW() WHERE id = %s"
            execute_query(update_task_query, (db_status, task_id))
        
        return jsonify({'success': True, 'message': 'Task update submitted successfully'})
        
    except Exception as e:
        print(f"Submit task update error: {e}")
        return jsonify({'error': 'Failed to submit task update'}), 500

@app.route('/api/admin/task-updates', methods=['GET'])
def get_task_updates():
    """Get all task updates for admin dashboard"""
    try:
        query = """
        SELECT tu.*, u.name as employee_name, t.title as task_title
        FROM task_updates tu
        JOIN users u ON tu.employee_id = u.id
        JOIN tasks t ON tu.task_id = t.id
        ORDER BY tu.created_at DESC
        LIMIT 20
        """
        
        updates = execute_query(query, fetch_all=True)
        return jsonify(updates)
        
    except Exception as e:
        print(f"Get task updates error: {e}")
        return jsonify({'error': 'Failed to get task updates'}), 500

@app.route('/api/employee/project-updates', methods=['POST'])
def submit_project_update():
    """Allow employee to submit updates for assigned projects"""
    try:
        data = request.get_json()
        
        project_id = data.get('project_id')
        employee_id = data.get('employee_id')
        update_message = data.get('update_message')
        progress_percentage = data.get('progress_percentage', 0)
        status = data.get('status')
        
        if not project_id or not employee_id or not update_message:
            return jsonify({'error': 'Project ID, Employee ID, and update message are required'}), 400
        
        # Verify the project is assigned to this employee
        verify_query = """
        SELECT id FROM projects 
        WHERE id = %s AND assigned_to_type = 'employee' AND assigned_to_id = %s
        """
        project_exists = execute_query(verify_query, (project_id, employee_id), fetch_one=True)
        
        if not project_exists:
            return jsonify({'error': 'Project not found or not assigned to this employee'}), 404
        
        # Insert the update
        insert_query = """
        INSERT INTO project_updates (project_id, employee_id, update_message, progress_percentage, status, created_at)
        VALUES (%s, %s, %s, %s, %s, NOW())
        """
        
        execute_query(insert_query, (project_id, employee_id, update_message, progress_percentage, status))
        
        # Update project status if provided
        if status:
            # Map status values to match database enum for projects
            status_mapping = {
                'planning': 'Planning',
                'active': 'Active',
                'in_progress': 'Active',  # Map in_progress to Active for projects
                'on_hold': 'On Hold',
                'completed': 'Completed',
                'cancelled': 'Cancelled'
            }
            db_status = status_mapping.get(status.lower(), status)
            update_project_query = "UPDATE projects SET status = %s, updated_at = NOW() WHERE id = %s"
            execute_query(update_project_query, (db_status, project_id))
        
        return jsonify({'success': True, 'message': 'Project update submitted successfully'})
        
    except Exception as e:
        print(f"Submit project update error: {e}")
        return jsonify({'error': 'Failed to submit project update'}), 500

@app.route('/api/admin/project-updates', methods=['GET'])
def get_project_updates():
    """Get all project updates for admin dashboard"""
    try:
        query = """
        SELECT pu.*, u.name as employee_name, p.name as project_title
        FROM project_updates pu
        JOIN users u ON pu.employee_id = u.id
        JOIN projects p ON pu.project_id = p.id
        ORDER BY pu.created_at DESC
        LIMIT 20
        """
        
        updates = execute_query(query, fetch_all=True)
        return jsonify(updates)
        
    except Exception as e:
        print(f"Get project updates error: {e}")
        return jsonify({'error': 'Failed to get project updates'}), 500

@app.route('/api/employee/ticket-updates', methods=['POST'])
def submit_ticket_update():
    """Allow employee to submit updates for assigned tickets"""
    try:
        data = request.get_json()
        
        ticket_id = data.get('ticket_id')
        employee_id = data.get('employee_id')
        update_message = data.get('update_message')
        status = data.get('status')
        
        if not ticket_id or not employee_id or not update_message:
            return jsonify({'error': 'Ticket ID, Employee ID, and update message are required'}), 400
        
        # Verify the ticket is assigned to this employee
        verify_query = """
        SELECT id FROM tickets 
        WHERE id = %s AND assigned_to_type = 'employee' AND assigned_to_id = %s
        """
        ticket_exists = execute_query(verify_query, (ticket_id, employee_id), fetch_one=True)
        
        if not ticket_exists:
            return jsonify({'error': 'Ticket not found or not assigned to this employee'}), 404
        
        # Insert the update
        insert_query = """
        INSERT INTO ticket_updates (ticket_id, employee_id, update_message, status, created_at)
        VALUES (%s, %s, %s, %s, NOW())
        """
        
        execute_query(insert_query, (ticket_id, employee_id, update_message, status))
        
        # Update ticket status if provided
        if status:
            # Map status values to match database enum for tickets
            status_mapping = {
                'open': 'Open',
                'in_progress': 'In Progress',
                'resolved': 'Resolved',
                'closed': 'Closed'
            }
            db_status = status_mapping.get(status.lower(), status)
            update_ticket_query = "UPDATE tickets SET status = %s, updated_at = NOW() WHERE id = %s"
            execute_query(update_ticket_query, (db_status, ticket_id))
        
        return jsonify({'success': True, 'message': 'Ticket update submitted successfully'})
        
    except Exception as e:
        print(f"Submit ticket update error: {e}")
        return jsonify({'error': 'Failed to submit ticket update'}), 500

@app.route('/api/admin/ticket-updates', methods=['GET'])
def get_ticket_updates():
    """Get all ticket updates for admin dashboard"""
    try:
        query = """
        SELECT tu.*, u.name as employee_name, t.title as ticket_title
        FROM ticket_updates tu
        JOIN users u ON tu.employee_id = u.id
        JOIN tickets t ON tu.ticket_id = t.id
        ORDER BY tu.created_at DESC
        LIMIT 20
        """
        
        updates = execute_query(query, fetch_all=True)
        return jsonify(updates)
        
    except Exception as e:
        print(f"Get ticket updates error: {e}")
        return jsonify({'error': 'Failed to get ticket updates'}), 500

@app.route('/api/notifications/mark-as-read', methods=['POST'])
def mark_notification_as_read():
    """Mark a notification as read for a user"""
    try:
        data = request.get_json()
        
        user_id = data.get('user_id')
        notification_type = data.get('notification_type')
        notification_id = data.get('notification_id')
        
        if not user_id or not notification_type or not notification_id:
            return jsonify({'error': 'User ID, notification type, and notification ID are required'}), 400
        
        # Insert or update the read status
        query = """
        INSERT INTO user_notifications (user_id, notification_type, notification_id, is_read, read_at)
        VALUES (%s, %s, %s, 1, NOW())
        ON CONFLICT (user_id, notification_type, notification_id) 
        DO UPDATE SET is_read = 1, read_at = NOW()
        """
        
        execute_query(query, (user_id, notification_type, notification_id))
        
        return jsonify({'success': True, 'message': 'Notification marked as read'})
        
    except Exception as e:
        print(f"Mark notification as read error: {e}")
        return jsonify({'error': 'Failed to mark notification as read'}), 500

@app.route('/api/notifications/<notification_type>/<notification_id>', methods=['GET'])
def get_notification_details(notification_type, notification_id):
    """Get detailed information about a specific notification"""
    try:
        if notification_type == 'task':
            query = """
            SELECT t.*, u.name as assigned_to_name, u.email as assigned_to_email
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to_type = 'employee' AND t.assigned_to_id = u.id
            WHERE t.id = %s
            """
            result = execute_query(query, (notification_id,), fetch_one=True)
            
        elif notification_type == 'project':
            query = """
            SELECT p.*, u.name as assigned_to_name, u.email as assigned_to_email
            FROM projects p
            LEFT JOIN users u ON p.assigned_to_type = 'employee' AND p.assigned_to_id = u.id
            WHERE p.id = %s
            """
            result = execute_query(query, (notification_id,), fetch_one=True)
            
        elif notification_type == 'ticket':
            query = """
            SELECT t.*, u.name as assigned_to_name, u.email as assigned_to_email
            FROM tickets t
            LEFT JOIN users u ON t.assigned_to_type = 'employee' AND t.assigned_to_id = u.id
            WHERE t.id = %s
            """
            result = execute_query(query, (notification_id,), fetch_one=True)
            
        elif notification_type == 'announcement':
            query = """
            SELECT a.*, u.name as created_by_name
            FROM announcements a
            LEFT JOIN users u ON a.created_by = u.id
            WHERE a.id = %s
            """
            result = execute_query(query, (notification_id,), fetch_one=True)
            
        else:
            return jsonify({'error': 'Invalid notification type'}), 400
        
        if not result:
            return jsonify({'error': 'Notification not found'}), 404
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Get notification details error: {e}")
        return jsonify({'error': 'Failed to get notification details'}), 500

@app.route('/api/admin/test-approval/<int:vendor_id>', methods=['GET'])
def test_approval_process(vendor_id):
    """Test endpoint to debug approval process"""
    try:
        print(f"Testing approval process for vendor ID: {vendor_id}")
        
        # Get vendor details
        query = "SELECT * FROM vendors WHERE id = %s"
        vendor = execute_query(query, (vendor_id,), fetch_one=True)
        
        if not vendor:
            return jsonify({'success': False, 'message': 'Vendor not found'}), 404
        
        return jsonify({
            'success': True,
            'vendor': {
                'id': vendor['id'],
                'company_name': vendor['company_name'],
                'email': vendor['email'],
                'nda_status': vendor['nda_status'],
                'portal_access': vendor['portal_access'],
                'reference_number': vendor['reference_number']
            }
        })
        
    except Exception as e:
        print(f"Test approval error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/vendors/<int:vendor_id>/approve-portal-access', methods=['POST'])
def approve_vendor_portal_access(vendor_id):
    try:
        print(f"Starting approval process for vendor ID: {vendor_id}")
        
        # Get vendor details
        query = "SELECT * FROM vendors WHERE id = %s"
        vendor = execute_query(query, (vendor_id,), fetch_one=True)
        
        if not vendor:
            print(f"Vendor with ID {vendor_id} not found")
            return jsonify({'success': False, 'message': 'Vendor not found'}), 404
        
        print(f"Found vendor: {vendor['company_name']}, NDA Status: {vendor['nda_status']}")
        
        if vendor['nda_status'] != 'completed':
            print(f"Vendor NDA status is {vendor['nda_status']}, not completed")
            return jsonify({'success': False, 'message': 'Vendor NDA must be completed before approval'}), 400
        
        # Generate unique password for vendor
        vendor_password = generate_vendor_password()
        password_hash = bcrypt.hashpw(vendor_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        print(f"Generated password for vendor: {vendor_password[:5]}...")
        
        # Update vendor status
        query = "UPDATE vendors SET portal_access = 1, nda_status = 'approved' WHERE id = %s"
        execute_query(query, (vendor_id,))
        print("Updated vendor status to approved")
        
        # Check if user already exists
        check_query = "SELECT id FROM users WHERE email = %s"
        existing_user = execute_query(check_query, (vendor['email'],), fetch_one=True)
        
        if existing_user:
            # Update existing user
            query = """
            UPDATE users SET password_hash = %s, user_type = %s, updated_at = %s
            WHERE email = %s
            """
            execute_query(query, (password_hash, 'vendor', datetime.now(), vendor['email']))
        else:
            # Insert new user
            query = """
            INSERT INTO users (email, password_hash, name, user_type, created_at)
            VALUES (%s, %s, %s, %s, %s)
            """
            execute_query(query, (vendor['email'], password_hash, vendor['contact_person'], 'vendor', datetime.now()))
        print("Created/updated vendor user account")
        
        # Check if vendor login already exists
        check_query = "SELECT id FROM vendor_logins WHERE email = %s"
        existing_login = execute_query(check_query, (vendor['email'],), fetch_one=True)
        
        if existing_login:
            # Update existing vendor login
            login_query = """
            UPDATE vendor_logins SET password_hash = %s, is_active = %s, updated_at = %s
            WHERE email = %s
            """
            execute_query(login_query, (password_hash, 1, datetime.now(), vendor['email']))
        else:
            # Insert new vendor login
            login_query = """
            INSERT INTO vendor_logins (vendor_id, email, password_hash, company_name, contact_person, phone, address, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            execute_query(login_query, (
                vendor['id'],
                vendor['email'],
                password_hash,
                vendor['company_name'],
                vendor['contact_person'],
                vendor['phone'],
                vendor['address'],
                1
            ))
        print("Created/updated vendor login credentials")
        
        # Send approval email with login credentials
        try:
            print(f"Attempting to send email to {vendor['email']}")
            msg = MIMEMultipart()
            msg['From'] = SMTP_USERNAME
            msg['To'] = vendor['email']
            msg['Subject'] = f"NDA Approved - Portal Access Granted - {vendor['company_name']}"
            
            # Email body
            body = f"""
Dear {vendor['contact_person']},

Subject: NDA Approval Confirmation - Portal Access Granted

We are pleased to inform you that your Non-Disclosure Agreement has been successfully reviewed and approved by our legal department. On behalf of YellowStone Xperiences Pvt Ltd, we extend our congratulations and welcome you to our Strategic Partnership Program.

REFERENCE NUMBER: {vendor['reference_number']}
COMPANY: {vendor['company_name']}

PORTAL ACCESS CREDENTIALS:
Email Address: {vendor['email']}
Temporary Password: {vendor_password}
Portal URL: https://yellowstonexperiences.com/vendor_portal/

IMPORTANT SECURITY REQUIREMENTS:
1. You are required to change your password immediately upon first login
2. Maintain strict confidentiality of your login credentials
3. Access the portal only from secure, authorized devices
4. Report any suspicious activity immediately to our IT Security Department

NEXT STEPS:
- Log in to the portal using the provided credentials
- Complete your profile setup
- Review available partnership opportunities
- Familiarize yourself with our vendor guidelines and procedures

Should you encounter any technical difficulties or require assistance, please contact our Vendor Support Team at your earliest convenience.

We look forward to a successful and mutually beneficial partnership.

Yours sincerely,

Harpreet Singh
CEO
YellowStone Xperiences Pvt Ltd
Email: Harpreet.singh@yellowstonexps.com
Phone: [Contact Number]
Address: Plot # 2, ITC, Fourth Floor, Sector 67, Mohali -160062, Punjab, India

---
This is an automated message. Please do not reply to this email address.
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Connect to SMTP server and send email
            print(f"Connecting to SMTP server: {SMTP_SERVER}:{SMTP_PORT}")
            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            print(f"Logging in with username: {SMTP_USERNAME}")
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            text = msg.as_string()
            server.sendmail(SMTP_USERNAME, vendor['email'], text)
            server.quit()
            
            print(f"Approval email sent successfully to {vendor['email']}")
            
        except Exception as email_error:
            print(f"Approval email sending failed: {email_error}")
            print(f"Email error type: {type(email_error).__name__}")
            # Still return success since the database operations succeeded
        
        print("Approval process completed successfully")
        return jsonify({'success': True, 'message': 'Vendor approved and login credentials sent'})
        
    except Exception as e:
        print(f"Approve vendor error: {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to approve vendor: {str(e)}'}), 500

@app.route('/api/admin/nda-forms', methods=['GET'])
def get_nda_forms():
    """Get all completed and approved NDA forms with full details"""
    try:
        query = """
        SELECT v.*, u.name as contact_person_name, u.email as vendor_email
        FROM vendors v
        LEFT JOIN users u ON v.email = u.email
        WHERE v.nda_status IN ('completed', 'approved')
        ORDER BY v.signed_date DESC, v.created_at DESC
        """
        forms = execute_query(query, fetch_all=True)
        
        # Handle case where query returns None
        if forms is None:
            forms = []
        
        # Format the response
        formatted_forms = []
        for form in forms:
            formatted_form = {
                'id': form['id'],
                'reference_number': form['reference_number'],
                'company_name': form['company_name'],
                'email': form['email'],
                'contact_person': form['contact_person'],
                'phone': form['phone'],
                'address': form['address'],
                'company_registration_number': form['company_registration_number'],
                'company_incorporation_country': form['company_incorporation_country'],
                'company_incorporation_state': form['company_incorporation_state'],
                'nda_status': form['nda_status'],
                'portal_access': form['portal_access'],
                'signature_type': form['signature_type'],
                'has_signature': bool(form['signature_data']),
                'has_company_stamp': bool(form['company_stamp_data']),
                'signature_data': form['signature_data'] if form['signature_data'] else None,
                'company_stamp_data': form['company_stamp_data'] if form['company_stamp_data'] else None,
                'signed_date': form['signed_date'].isoformat() if form['signed_date'] else None,
                'created_at': form['created_at'].isoformat(),
                'updated_at': form['updated_at'].isoformat()
            }
            formatted_forms.append(formatted_form)
        
        return jsonify(formatted_forms)
        
    except Exception as e:
        print(f"Get NDA forms error: {e}")
        return jsonify({'error': 'Failed to get NDA forms'}), 500

@app.route('/api/admin/download-nda/<reference_number>', methods=['GET'])
def download_nda_pdf(reference_number):
    """Download NDA PDF for a specific reference number"""
    try:
        # Get vendor data
        query = """
        SELECT v.*, u.name as contact_person_name, u.email as vendor_email
        FROM vendors v
        LEFT JOIN users u ON v.email = u.email
        WHERE v.reference_number = %s AND v.nda_status IN ('completed', 'approved')
        """
        vendor = execute_query(query, (reference_number,), fetch_one=True)
        
        if not vendor:
            return jsonify({'error': 'NDA form not found'}), 404
        
        # Create PDF buffer
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        
        # Generate PDF content using helper function
        story = generate_nda_pdf_content(vendor, doc, styles)
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        # Check if PDF was generated successfully
        if buffer.getvalue() == b'':
            return jsonify({'error': 'Failed to generate PDF'}), 500
        
        # Return PDF response
        response = make_response(buffer.getvalue())
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename=NDA_{reference_number}.pdf'
        response.headers['Content-Length'] = str(len(buffer.getvalue()))
        
        return response
        
    except Exception as e:
        print(f"Download NDA PDF error: {e}")
        return jsonify({'error': 'Failed to download NDA PDF'}), 500

@app.route('/api/admin/download-completed-nda/<int:form_id>', methods=['GET'])
def download_completed_nda_pdf(form_id):
    """Download completed NDA PDF by form ID (for FormsView component)"""
    try:
        # Get vendor data by form ID
        query = """
        SELECT v.*, u.name as contact_person_name, u.email as vendor_email
        FROM vendors v
        LEFT JOIN users u ON v.email = u.email
        WHERE v.id = %s AND v.nda_status IN ('completed', 'approved')
        """
        vendor = execute_query(query, (form_id,), fetch_one=True)
        
        if not vendor:
            return jsonify({'error': 'NDA form not found'}), 404
        
        # Create PDF buffer
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        
        # Generate PDF content using helper function
        story = generate_nda_pdf_content(vendor, doc, styles)
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        # Check if PDF was generated successfully
        if buffer.getvalue() == b'':
            return jsonify({'error': 'Failed to generate PDF'}), 500
        
        # Return PDF response
        response = make_response(buffer.getvalue())
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename=NDA_{vendor["reference_number"]}.pdf'
        response.headers['Content-Length'] = str(len(buffer.getvalue()))
        
        return response
        
    except Exception as e:
        print(f"Download completed NDA PDF error: {e}")
        return jsonify({'error': 'Failed to download completed NDA PDF'}), 500

def generate_nda_pdf_content(vendor, doc, styles):
    """Helper function to generate NDA PDF content with signatures"""
    story = []
    
    # Header with reference number and email
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontSize=10,
        alignment=0,  # Left alignment
        spaceAfter=10
    )
    
    # Create header table with reference number (left) and email (right)
    header_data = [
        [f"Reference: {vendor['reference_number']}", f"Email: {vendor['email']}"]
    ]
    header_table = Table(header_data, colWidths=[doc.width/2, doc.width/2])
    header_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.darkblue),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 20))
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=30,
        alignment=1,  # Center alignment
        textColor=colors.darkblue
    )
    story.append(Paragraph("Confidentiality & Nondisclosure Agreement (NDA)", title_style))
    story.append(Spacer(1, 20))
    
    # Date
    date_style = ParagraphStyle(
        'DateStyle',
        parent=styles['Normal'],
        fontSize=12,
        alignment=1,
        spaceAfter=20
    )
    story.append(Paragraph(f"This agreement is entered into on {vendor['signed_date'].strftime('%d, %B, %Y') if vendor['signed_date'] else datetime.now().strftime('%d, %B, %Y')}, by and among:", date_style))
    story.append(Spacer(1, 20))
    
    # Parties
    party_style = ParagraphStyle(
        'PartyStyle',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=15
    )
    
    story.append(Paragraph("<b>(1)</b> YellowStone Xperiences Pvt Ltd, a company incorporated and existing under the laws of Company Act, India, having its registered office at Plot # 2, ITC, Fourth Floor, Sector 67, Mohali -160062, Punjab, India, registered with the company registration number U72900PB2020PTC051260, hereinafter referred to as \"YSXP\", And", party_style))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph(f"<b>(2)</b> {vendor['company_name']}, a company incorporated and existing under the laws of {vendor.get('company_incorporation_country', 'India')}, having its registered office at {vendor.get('address', 'Address not provided')}, registered with the company registration number {vendor.get('company_registration_number', 'Not provided')}, hereinafter referred to as \"{vendor['company_name']}\".", party_style))
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("<b>WHEREAS:</b>", styles['Heading2']))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("A. YSXP is engaged in the business of providing comprehensive business solutions, including but not limited to digital marketing, technology consulting, and strategic advisory services.", party_style))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph(f"B. {vendor['company_name']} is interested in exploring potential business opportunities and collaborations with YSXP.", party_style))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("C. In the course of discussions and negotiations, YSXP may disclose certain confidential and proprietary information to the other party.", party_style))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("D. Both parties recognize the need to protect such confidential information and maintain its confidentiality.", party_style))
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("<b>NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein, the parties agree as follows:</b>", party_style))
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("<b>1. DEFINITION OF CONFIDENTIAL INFORMATION</b>", styles['Heading2']))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("For the purposes of this Agreement, \"Confidential Information\" shall mean all non-public, proprietary, or confidential information disclosed by one party (\"Disclosing Party\") to the other party (\"Receiving Party\"), whether orally, in writing, or in any other form, including but not limited to:", party_style))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("a) Technical data, know-how, research, product plans, products, services, customers, customer lists, markets, software, developments, inventions, processes, formulas, technology, designs, drawings, engineering, hardware configuration information, marketing, finances, or other business information;", party_style))
    story.append(Spacer(1, 5))
    
    story.append(Paragraph("b) Any information that would be considered confidential by a reasonable person in the circumstances;", party_style))
    story.append(Spacer(1, 5))
    
    story.append(Paragraph("c) Any information marked or designated as \"confidential,\" \"proprietary,\" or with a similar designation;", party_style))
    story.append(Spacer(1, 5))
    
    story.append(Paragraph("d) Any information that, by its nature, should reasonably be considered confidential.", party_style))
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("<b>2. OBLIGATIONS OF RECEIVING PARTY</b>", styles['Heading2']))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("The Receiving Party agrees to:", party_style))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("a) Hold and maintain the Confidential Information in strict confidence;", party_style))
    story.append(Spacer(1, 5))
    
    story.append(Paragraph("b) Not disclose the Confidential Information to any third party without the prior written consent of the Disclosing Party;", party_style))
    story.append(Spacer(1, 5))
    
    story.append(Paragraph("c) Use the Confidential Information solely for the purpose of evaluating potential business opportunities with the Disclosing Party;", party_style))
    story.append(Spacer(1, 5))
    
    story.append(Paragraph("d) Take all reasonable precautions to protect the confidentiality of the Confidential Information;", party_style))
    story.append(Spacer(1, 5))
    
    story.append(Paragraph("e) Not make any copies of the Confidential Information except as necessary for the evaluation process.", party_style))
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("<b>3. EXCEPTIONS</b>", styles['Heading2']))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("The obligations set forth in Section 2 shall not apply to information that:", party_style))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("a) Is or becomes publicly available through no breach of this Agreement by the Receiving Party;", party_style))
    story.append(Spacer(1, 5))
    
    story.append(Paragraph("b) Was rightfully known by the Receiving Party prior to disclosure by the Disclosing Party;", party_style))
    story.append(Spacer(1, 5))
    
    story.append(Paragraph("c) Is rightfully received by the Receiving Party from a third party without breach of any confidentiality obligation;", party_style))
    story.append(Spacer(1, 5))
    
    story.append(Paragraph("d) Is independently developed by the Receiving Party without use of or reference to the Confidential Information.", party_style))
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("<b>4. RETURN OF INFORMATION</b>", styles['Heading2']))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("Upon request by the Disclosing Party, or upon termination of discussions between the parties, the Receiving Party shall promptly return or destroy all copies of the Confidential Information and certify in writing that such return or destruction has been completed.", party_style))
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("<b>5. TERM</b>", styles['Heading2']))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("This Agreement shall remain in effect for a period of five (5) years from the date of execution, unless terminated earlier by mutual written consent of the parties.", party_style))
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("<b>6. NO GRANT OF RIGHTS</b>", styles['Heading2']))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("Nothing in this Agreement shall be construed as granting any rights, by license or otherwise, to any Confidential Information or any intellectual property rights therein.", party_style))
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("<b>7. GOVERNING LAW</b>", styles['Heading2']))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("This Agreement shall be governed in all respects in accordance with the laws of Mohali, Punjab, India.", party_style))
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("<b>8. AMENDMENTS, FILLING, CANCELLATION, TERMINATION AND RENEWAL OF AGREEMENT</b>", styles['Heading2']))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("Any term of this Agreement may be amended, filled, cancelled, terminated and renewed under the written mutual consent of the parties. This said all matters shall be done by giving 30 days advance written notice each other.", party_style))
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("<b>9. REMEDIES</b>", styles['Heading2']))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("If a party breaches this NDA, this party must be taken the action under the laws of Mohali, Punjab, India. However, on mutual agreement of both parties the geographical location can be changed and accordingly the law of land would be followed. The parties agree that if it is in any breach of this Agreement, including without limiting any actual or threatened disclosure of Confidential Information without the prior expressed written consent of the disclosing party for which no adequate remedy under law exists, the injured party shall have right not only to terminate the Agreement but also the entitlement for equitable remedies, injunctive relief and specific performance to redress any breach or threatened breach of this Agreement made directly and indirectly by the receiving party or any of its advisors or Affiliates, or any other persons acting for or on behalf of or with the receiving party.", party_style))
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("<b>10. VALID NOTICES</b>", styles['Heading2']))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("All notices under this Agreement shall be deemed to have been duly given upon the mailing of the notice, in person or by courier, sent by fax, e-mail to the Party entitled to such notice at the address.", party_style))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("<b>If to Yellowstone Xperiences Private Limited:</b>", party_style))
    story.append(Paragraph("Postal address: Plot # 2, ITC, Fourth Floor, Sector 67, Mohali, Punjab, India (160062).", party_style))
    story.append(Paragraph("E-mail: hello@yellowstonexps.com", party_style))
    story.append(Paragraph("Harpreet.singh@yellowstonexps.com", party_style))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph(f"<b>If to {vendor['company_name']}:</b>", party_style))
    story.append(Paragraph(f"Postal address: {vendor['address']}", party_style))
    story.append(Paragraph(f"Phone: {vendor['phone']}", party_style))
    story.append(Paragraph(f"E-mail: {vendor['email']}", party_style))
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("<b>11. DISPUTE SETTLEMENT</b>", styles['Heading2']))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("If any dispute arises relating to non-disclosure of confidential information, the parties shall perform by negotiation at first. If no decision can be made only, the injured party can sue for compensation in the court.", party_style))
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("<b>IN WITNESS WHEREOF, the parties have executed this Agreement on the date first written above by their fully authorized representatives with their free consent.</b>", party_style))
    story.append(Spacer(1, 30))
    
    # Signature lines with actual signatures
    signature_style = ParagraphStyle(
        'SignatureStyle',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=15
    )
    
    # YSXP signature
    story.append(Paragraph("<b>For YSXP:</b>", signature_style))
    story.append(Spacer(1, 20))
    
    # Get admin signature if available
    admin_signature_query = "SELECT signature_data FROM admin_signatures ORDER BY created_at DESC LIMIT 1"
    admin_signature = execute_query(admin_signature_query, fetch_one=True)
    
    if admin_signature and admin_signature['signature_data']:
        try:
            # Decode base64 signature and create image
            signature_data = admin_signature['signature_data']
            if signature_data.startswith('data:image'):
                signature_data = signature_data.split(',')[1]
            
            signature_bytes = base64.b64decode(signature_data)
            signature_buffer = BytesIO(signature_bytes)
            
            # Add signature image
            signature_img = Image(signature_buffer, width=2*inch, height=0.5*inch)
            story.append(signature_img)
            story.append(Spacer(1, 10))
        except Exception as e:
            print(f"Error adding admin signature: {e}")
            story.append(Paragraph("Signature: _________________", signature_style))
    else:
        story.append(Paragraph("Signature: _________________", signature_style))
    
    story.append(Paragraph("Name: Harpreet Singh", signature_style))
    story.append(Paragraph("Title: CEO", signature_style))
    story.append(Paragraph("Date: _________________", signature_style))
    story.append(Spacer(1, 20))
    
    # Second Party signature
    story.append(Paragraph(f"<b>For {vendor['company_name']}:</b>", signature_style))
    story.append(Spacer(1, 20))
    
    # Add vendor signature if available
    if vendor.get('signature_data'):
        try:
            # Decode base64 signature and create image
            signature_data = vendor['signature_data']
            if signature_data.startswith('data:image'):
                signature_data = signature_data.split(',')[1]
            
            signature_bytes = base64.b64decode(signature_data)
            signature_buffer = BytesIO(signature_bytes)
            
            # Add signature image
            signature_img = Image(signature_buffer, width=2*inch, height=0.5*inch)
            story.append(signature_img)
            story.append(Spacer(1, 10))
        except Exception as e:
            print(f"Error adding vendor signature: {e}")
            story.append(Paragraph("Signature: _________________", signature_style))
    else:
        story.append(Paragraph("Signature: _________________", signature_style))
    
    story.append(Paragraph(f"Name: <b>{vendor['contact_person']}</b>", signature_style))
    story.append(Paragraph("Title: _________________", signature_style))
    story.append(Paragraph("Date: _________________", signature_style))
    
    return story

def download_nda_pdf(reference_number):
    """Generate and download NDA PDF for a specific reference number"""
    try:
        # Get vendor details
        query = "SELECT * FROM vendors WHERE reference_number = %s"
        vendor = execute_query(query, (reference_number,), fetch_one=True)
        
        if not vendor:
            return jsonify({'error': 'NDA form not found'}), 404
        
        # Create PDF in memory
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        # Header with reference number and email
        header_data = [
            [f"Reference: {vendor['reference_number']}", f"Email: {vendor['email']}"]
        ]
        header_table = Table(header_data, colWidths=[doc.width/2, doc.width/2])
        header_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.darkblue),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 20))
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
            alignment=1,  # Center alignment
            textColor=colors.darkblue
        )
        story.append(Paragraph("Confidentiality & Nondisclosure Agreement (NDA)", title_style))
        story.append(Spacer(1, 20))
        
        # Date
        date_style = ParagraphStyle(
            'DateStyle',
            parent=styles['Normal'],
            fontSize=12,
            alignment=1,
            spaceAfter=20
        )
        story.append(Paragraph(f"This agreement is entered into on {vendor['signed_date'].strftime('%d, %B, %Y') if vendor['signed_date'] else datetime.now().strftime('%d, %B, %Y')}, by and among:", date_style))
        story.append(Spacer(1, 20))
        
        # Parties
        party_style = ParagraphStyle(
            'PartyStyle',
            parent=styles['Normal'],
            fontSize=11,
            spaceAfter=15
        )
        
        story.append(Paragraph("<b>(1)</b> YellowStone Xperiences Pvt Ltd, a company incorporated and existing under the laws of Company Act, India, having its registered office at Plot # 2, ITC, Fourth Floor, Sector 67, Mohali -160062, Punjab, India, registered with the company registration number U72900PB2020PTC051260, hereinafter referred to as \"YSXP\", And", party_style))
        story.append(Spacer(1, 10))
        
        story.append(Paragraph(f"<b>(2)</b> <b>{vendor['company_name']}</b>, a company incorporated and existing under the laws of Company Act, India, having its registered office at <b>{vendor['address']}</b> registered with the company registration number <b>{vendor['company_registration_number']}</b>, hereinafter referred to as \"<b>{vendor['company_name']}</b>\"", party_style))
        story.append(Spacer(1, 10))
        
        story.append(Paragraph("hereinafter also referred to individually as a \"Party\" and collectively as the \"Parties\".", party_style))
        story.append(Spacer(1, 20))
        
        # Background
        story.append(Paragraph("<b>1. PURPOSE</b>", styles['Heading2']))
        story.append(Spacer(1, 10))
        
        story.append(Paragraph(f"In connection with discussions between YellowStone Xperiences Pvt Ltd and <b>{vendor['company_name']}</b> concerning Company's Local representative under capacity of Strategic Partnership for cross selling of products and services. In order to pursue this Purpose, the Parties recognize that there is a need to disclose certain confidential information by the Disclosing Party (i.e., Party disclosing such information) to Receiving Party (i.e., Party receiving such information) to be used only for this Purpose and to protect such confidential information from unauthorized use and disclosure. The Disclosing Party has agreed to disclose to the Receiving Party the confidential information on a strictly confidential basis.", party_style))
        story.append(Spacer(1, 20))
        
        story.append(Paragraph("<b>2. DEFINITION OF CONFIDENTIAL INFORMATION</b>", styles['Heading2']))
        story.append(Spacer(1, 10))
        
        story.append(Paragraph("\"Confidential Information\" shall mean all information, whether disclosed before or after the Effective Date, that is disclosed in written, oral, electronic, visual or other form by either party (each, as a \"Disclosing Party\") to the other party (each, as a \"Receiving Party\") and either (i) marked or designated as \"confidential\" or \"proprietary\" at the time of disclosure or (ii) otherwise clearly indicated to be confidential at the time of disclosure. IT Confidential Information may include, without limitation, computer programs, software or hardware products, product development plans, sketches, drawings, models, proposed services, discoveries, ideas, concepts, equipment, code, software source documents and related technical information algorithms, know-how, trade secrets, formulas, processes, procedures, ideas, research, inventions (whether patentable or not), copyrights, schematics and other technical, names and expertise of employees and consultants and customer or partner information.", party_style))
        story.append(Spacer(1, 20))
        
        story.append(Paragraph("<b>3. CONFIDENTIALITY OBLIGATION</b>", styles['Heading2']))
        story.append(Spacer(1, 10))
        
        story.append(Paragraph("Receiving Party agrees to protect the Confidential Information by using the same degree of care as Receiving Party uses to protect its own confidential or proprietary information (but not less than a reasonable degree of care): (i) to prevent the unauthorized use, dissemination or publication of the Confidential Information (ii) not to divulge Confidential Information to any third party, (iii) not to make any use of such Confidential Information except for the Business Purpose, and (iv) not to copy except as reasonably required in direct support of the Business Purpose. Any copies made will include appropriate marking identifying same as constituting or containing Confidential Information of Disclosing Party; and (v) not to reverse engineer any such Confidential Information. Receiving Party shall limit the use of and access to Disclosing Party's Confidential Information to Receiving Party's employees and to the employees of Receiving Party's respective parent, subsidiaries and affiliated entities or authorized representatives who have: (i) a need to know and have been notified that such information is Confidential Information to be used solely for the Business Purpose; and (ii) entered into binding confidentiality obligations no less protective of Disclosing Party than those contained in this Agreement. Receiving Party may disclose Confidential Information pursuant to any statutory or regulatory authority or court order, provided Disclosing Party is given prompt prior written notice of such requirement and the scope of such disclosure is limited to the extent possible.", party_style))
        story.append(Spacer(1, 20))
        
        story.append(Paragraph("<b>4. NON-DISCLOSURE OF CONFIDENTIAL INFORMATION</b>", styles['Heading2']))
        story.append(Spacer(1, 10))
        
        story.append(Paragraph("Receiving Party shall only permit access to Confidential Information to those of its employees or authorized representatives who have a need to know and shall not disclose it to third parties.", party_style))
        story.append(Spacer(1, 20))
        
        story.append(Paragraph("<b>5. RETURN OF CONFIDENTIAL INFORMATION</b>", styles['Heading2']))
        story.append(Spacer(1, 10))
        
        story.append(Paragraph("All Confidential Information furnished under this Agreement, shall remain the property of the Disclosing Party and shall be returned to it without retaining any copies or it shall be destroyed all documents and other materials promptly upon the termination of this Agreement under the consent of both parties or any breach of contract made by either party.", party_style))
        story.append(Spacer(1, 20))
        
        story.append(Paragraph("<b>6. TERM</b>", styles['Heading2']))
        story.append(Spacer(1, 10))
        
        story.append(Paragraph("This Agreement shall come into force from the effective date of this deed and shall continue for two (2) years from the effective Date, unless earlier terminated by either Party with 30 days' prior written notice.", party_style))
        story.append(Spacer(1, 20))
        
        story.append(Paragraph("<b>7. GOVERNING LAW</b>", styles['Heading2']))
        story.append(Spacer(1, 10))
        
        story.append(Paragraph("This Agreement shall be governed in all respects in accordance with the laws of Mohali, Punjab, India.", party_style))
        story.append(Spacer(1, 20))
        
        story.append(Paragraph("<b>8. AMENDMENTS, FILLING, CANCELLATION, TERMINATION AND RENEWAL OF AGREEMENT</b>", styles['Heading2']))
        story.append(Spacer(1, 10))
        
        story.append(Paragraph("Any term of this Agreement may be amended, filled, cancelled, terminated and renewed under the written mutual consent of the parties. This said all matters shall be done by giving 30 days advance written notice each other.", party_style))
        story.append(Spacer(1, 20))
        
        story.append(Paragraph("<b>9. REMEDIES</b>", styles['Heading2']))
        story.append(Spacer(1, 10))
        
        story.append(Paragraph("If a party breaches this NDA, this party must be taken the action under the laws of Mohali, Punjab, India. However, on mutual agreement of both parties the geographical location can be changed and accordingly the law of land would be followed. The parties agree that if it is in any breach of this Agreement, including without limiting any actual or threatened disclosure of Confidential Information without the prior expressed written consent of the disclosing party for which no adequate remedy under law exists, the injured party shall have right not only to terminate the Agreement but also the entitlement for equitable remedies, injunctive relief and specific performance to redress any breach or threatened breach of this Agreement made directly and indirectly by the receiving party or any of its advisors or Affiliates, or any other persons acting for or on behalf of or with the receiving party.", party_style))
        story.append(Spacer(1, 20))
        
        story.append(Paragraph("<b>10. VALID NOTICES</b>", styles['Heading2']))
        story.append(Spacer(1, 10))
        
        story.append(Paragraph("All notices under this Agreement shall be deemed to have been duly given upon the mailing of the notice, in person or by courier, sent by fax, e-mail to the Party entitled to such notice at the address.", party_style))
        story.append(Spacer(1, 10))
        
        story.append(Paragraph("<b>If to Yellowstone Xperiences Private Limited:</b>", party_style))
        story.append(Paragraph("Postal address: Plot # 2, ITC, Fourth Floor, Sector 67, Mohali, Punjab, India (160062).", party_style))
        story.append(Paragraph("E-mail: hello@yellowstonexps.com", party_style))
        story.append(Paragraph("Harpreet.singh@yellowstonexps.com", party_style))
        story.append(Spacer(1, 10))
        
        story.append(Paragraph(f"<b>If to {vendor['company_name']}:</b>", party_style))
        story.append(Paragraph(f"Postal address: {vendor['address']}", party_style))
        story.append(Paragraph(f"Phone: {vendor['phone']}", party_style))
        story.append(Paragraph(f"E-mail: {vendor['email']}", party_style))
        story.append(Spacer(1, 20))
        
        story.append(Paragraph("<b>11. DISPUTE SETTLEMENT</b>", styles['Heading2']))
        story.append(Spacer(1, 10))
        
        story.append(Paragraph("If any dispute arises relating to non-disclosure of confidential information, the parties shall perform by negotiation at first. If no decision can be made only, the injured party can sue for compensation in the court.", party_style))
        story.append(Spacer(1, 20))
        
        story.append(Paragraph("<b>IN WITNESS WHEREOF, the parties have executed this Agreement on the date first written above by their fully authorized representatives with their free consent.</b>", party_style))
        story.append(Spacer(1, 30))
        
        # Signature lines
        signature_style = ParagraphStyle(
            'SignatureStyle',
            parent=styles['Normal'],
            fontSize=10,
            spaceAfter=15
        )
        
        # YSXP signature
        story.append(Paragraph("<b>For YSXP:</b>", signature_style))
        story.append(Spacer(1, 20))
        story.append(Paragraph("Signature: _________________", signature_style))
        story.append(Paragraph("Name: Harpreet Singh", signature_style))
        story.append(Paragraph("Title: CEO", signature_style))
        story.append(Paragraph("Date: _________________", signature_style))
        story.append(Spacer(1, 20))
        
        # Second Party signature
        story.append(Paragraph(f"<b>For {vendor['company_name']}:</b>", signature_style))
        story.append(Spacer(1, 20))
        story.append(Paragraph("Signature: _________________", signature_style))
        story.append(Paragraph(f"Name: <b>{vendor['contact_person']}</b>", signature_style))
        story.append(Paragraph("Title: _________________", signature_style))
        story.append(Paragraph("Date: _________________", signature_style))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        # Return PDF as response
        from flask import Response
        pdf_data = buffer.getvalue()
        
        if not pdf_data:
            return jsonify({'error': 'PDF generation failed - empty content'}), 500
            
        return Response(
            pdf_data,
            mimetype='application/pdf',
            headers={
                'Content-Disposition': f'attachment; filename=NDA_{reference_number}.pdf',
                'Content-Length': str(len(pdf_data))
            }
        )
        
    except Exception as e:
        print(f"Download NDA PDF error: {e}")
        return jsonify({'error': 'Failed to generate NDA PDF'}), 500

@app.route('/api/admin/upload-signature', methods=['POST'])
def upload_admin_signature():
    """Upload admin signature for NDA documents"""
    try:
        data = request.get_json()
        signature_data = data.get('signature_data')
        signature_type = data.get('signature_type', 'upload')
        
        if not signature_data:
            return jsonify({'success': False, 'message': 'Signature data is required'}), 400
        
        # Store admin signature in database
        query = """
        INSERT INTO admin_signatures (signature_data, signature_type, created_at)
        VALUES (%s, %s, %s)
        """
        execute_query(query, (signature_data, signature_type, datetime.now()))
        
        return jsonify({'success': True, 'message': 'Admin signature uploaded successfully'})
        
    except Exception as e:
        print(f"Upload admin signature error: {e}")
        return jsonify({'success': False, 'message': 'Failed to upload admin signature'}), 500

@app.route('/api/admin/send-completed-nda-email', methods=['POST'])
def send_completed_nda_email():
    """Send completed NDA PDF to vendor via email"""
    try:
        data = request.get_json()
        reference_number = data.get('reference_number')
        
        if not reference_number:
            return jsonify({'success': False, 'message': 'Reference number is required'}), 400
        
        # Get vendor details
        query = "SELECT * FROM vendors WHERE reference_number = %s"
        vendor = execute_query(query, (reference_number,), fetch_one=True)
        
        if not vendor:
            return jsonify({'success': False, 'message': 'NDA form not found'}), 404
        
        # Generate PDF using the helper function with signatures
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        
        # Generate PDF content using helper function
        story = generate_nda_pdf_content(vendor, doc, styles)
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        # Send email with PDF attachment
        msg = MIMEMultipart()
        msg['From'] = SMTP_USERNAME
        msg['To'] = vendor['email']
        msg['Subject'] = f"Completed NDA Agreement - {vendor['company_name']} ({reference_number})"
        
        # Email body
        body = f"""
Dear {vendor['contact_person']},

Subject: Completed NDA Agreement - Official Documentation

We hope this correspondence finds you well.

We are pleased to provide you with the official documentation of your completed Non-Disclosure Agreement with YellowStone Xperiences Pvt Ltd. Please find the executed agreement attached to this correspondence for your records.

DOCUMENT DETAILS:
Reference Number: {reference_number}
Company: {vendor['company_name']}
Execution Date: {vendor['signed_date'].strftime('%d, %B, %Y') if vendor['signed_date'] else 'Not specified'}

IMPORTANT INFORMATION:
- This document contains the complete executed NDA agreement with all signatures
- Please retain this document for your records
- This agreement is legally binding and enforceable
- Contact us if you have any questions regarding this agreement

Should you require any clarification or have questions regarding this agreement, please do not hesitate to contact our legal department.

We appreciate your partnership and look forward to a successful collaboration.

Yours sincerely,

Harpreet Singh
CEO
YellowStone Xperiences Pvt Ltd
Email: Harpreet.singh@yellowstonexps.com
Phone: [Contact Number]
Address: Plot # 2, ITC, Fourth Floor, Sector 67, Mohali -160062, Punjab, India

---
This is an automated message. Please do not reply to this email address.
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Attach PDF
        pdf_attachment = MIMEBase('application', 'pdf')
        pdf_attachment.set_payload(buffer.getvalue())
        encoders.encode_base64(pdf_attachment)
        pdf_attachment.add_header(
            'Content-Disposition',
            f'attachment; filename=NDA_{reference_number}.pdf'
        )
        msg.attach(pdf_attachment)
        
        # Send email
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(SMTP_USERNAME, vendor['email'], text)
        server.quit()
        
        return jsonify({'success': True, 'message': 'Completed NDA sent to vendor email'})
        
    except Exception as e:
        print(f"Send completed NDA email error: {e}")
        return jsonify({'success': False, 'message': 'Failed to send completed NDA email'}), 500

@app.route('/vendor-portal')
def vendor_portal():
    """Serve the vendor portal page"""
    try:
        reference_number = request.args.get('ref')
        
        if not reference_number:
            return "Error: Reference number is required", 400
        
        # Get vendor data
        query = """
        SELECT * FROM vendors WHERE reference_number = %s
        """
        vendor = execute_query(query, (reference_number,), fetch_one=True)
        
        if not vendor:
            return "Error: Invalid reference number", 404
        
        # Generate the vendor portal HTML
        html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NDA Portal - {vendor['company_name']}</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Times New Roman', serif;
            background-color: #ffffff;
            color: #000000;
            line-height: 1.6;
        }}
        
        .container {{
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            border: 2px solid #000000;
        }}
        
        .header {{
            text-align: center;
            border-bottom: 2px solid #000000;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }}
        
        .header h1 {{
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }}
        
        .header h2 {{
            font-size: 18px;
            font-weight: normal;
        }}
        
        .steps {{
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            border-bottom: 1px solid #000000;
            padding-bottom: 20px;
        }}
        
        .step {{
            text-align: center;
            flex: 1;
            padding: 10px;
            border-right: 1px solid #000000;
        }}
        
        .step:last-child {{
            border-right: none;
        }}
        
        .step-number {{
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 5px;
        }}
        
        .step-label {{
            font-size: 12px;
        }}
        
        .form-section {{
            margin-bottom: 30px;
            border: 1px solid #000000;
            padding: 20px;
        }}
        
        .section-title {{
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            border-bottom: 1px solid #000000;
            padding-bottom: 5px;
        }}
        
        .form-group {{
            margin-bottom: 15px;
        }}
        
        .form-group label {{
            display: block;
            font-weight: bold;
            margin-bottom: 5px;
        }}
        
        .form-group input, .form-group textarea {{
            width: 100%;
            padding: 8px;
            border: 1px solid #000000;
            font-family: 'Times New Roman', serif;
        }}
        
        .form-group textarea {{
            height: 100px;
            resize: vertical;
        }}
        
        .button-group {{
            text-align: center;
            margin-top: 30px;
        }}
        
        .btn {{
            padding: 12px 30px;
            margin: 0 10px;
            border: 2px solid #000000;
            background-color: #ffffff;
            color: #000000;
            font-family: 'Times New Roman', serif;
            font-size: 14px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
        }}
        
        .btn:hover {{
            background-color: #000000;
            color: #ffffff;
        }}
        
        .btn-primary {{
            background-color: #000000;
            color: #ffffff;
        }}
        
        .btn-primary:hover {{
            background-color: #ffffff;
            color: #000000;
        }}
        
        .nda-content {{
            margin-top: 20px;
            padding: 20px;
            border: 1px solid #000000;
            background-color: #f9f9f9;
        }}
        
        .signature-section {{
            margin-top: 30px;
            padding: 20px;
            border: 1px solid #000000;
        }}
        
        .signature-canvas {{
            border: 1px solid #000000;
            margin: 10px 0;
        }}
        
        .success-message {{
            text-align: center;
            padding: 20px;
            background-color: #f0f8f0;
            border: 2px solid #000000;
            margin-top: 20px;
        }}
        
        .hidden {{
            display: none;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CONFIDENTIALITY & NON-DISCLOSURE AGREEMENT</h1>
            <h2>YellowStone Xperiences Pvt Ltd & {vendor['company_name']}</h2>
        </div>
        
        <div class="steps">
            <div class="step">
                <div class="step-number">STEP 1</div>
                <div class="step-label">CORPORATE INFORMATION</div>
            </div>
            <div class="step">
                <div class="step-number">STEP 2</div>
                <div class="step-label">AGREEMENT REVIEW</div>
            </div>
            <div class="step">
                <div class="step-number">STEP 3</div>
                <div class="step-label">EXECUTION & SUBMISSION</div>
            </div>
        </div>
        
        <div id="step1" class="form-section">
            <div class="section-title">CORPORATE INFORMATION</div>
            
            <div class="form-group">
                <label for="companyName">Company Name:</label>
                <input type="text" id="companyName" value="{vendor['company_name']}" readonly>
            </div>
            
            <div class="form-group">
                <label for="contactPerson">Contact Person:</label>
                <input type="text" id="contactPerson" value="{vendor['contact_person'] if vendor['contact_person'] and vendor['contact_person'] != 'None' else ''}" placeholder="Enter contact person name">
            </div>
            
            <div class="form-group">
                <label for="email">Email Address:</label>
                <input type="email" id="email" value="{vendor['email']}" readonly>
            </div>
            
            <div class="form-group">
                <label for="phone">Phone Number:</label>
                <input type="text" id="phone" value="{vendor['phone'] if vendor['phone'] and vendor['phone'] != 'None' else ''}" placeholder="Enter phone number">
            </div>
            
            <div class="form-group">
                <label for="address">Company Address:</label>
                <textarea id="address" placeholder="Enter company address">{vendor['address'] if vendor['address'] and vendor['address'] != 'None' else ''}</textarea>
            </div>
            
            <div class="button-group">
                <button class="btn btn-primary" onclick="nextStep()">PROCEED TO AGREEMENT REVIEW</button>
            </div>
        </div>
        
        <div id="step2" class="form-section hidden">
            <div class="section-title">AGREEMENT REVIEW</div>
            <div class="nda-content" id="ndaContent">
                <!-- NDA content will be populated here -->
            </div>
            <div class="button-group">
                <button class="btn" onclick="prevStep()">PREVIOUS</button>
                <button class="btn btn-primary" onclick="nextStep()">PROCEED TO EXECUTION</button>
            </div>
        </div>
        
        <div id="step3" class="form-section hidden">
            <div class="section-title">EXECUTION & SUBMISSION</div>
            
            <div class="signature-section">
                <h3>Digital Signature (Required)</h3>
                <p>Please provide your digital signature using one of the methods below:</p>
                
                <div class="form-group">
                    <label>
                        <input type="radio" name="signatureMethod" value="draw" checked>
                        Draw Signature
                    </label>
                    <canvas id="signatureCanvas" class="signature-canvas" width="400" height="150"></canvas>
                    <button class="btn" onclick="clearSignature()">Clear Signature</button>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="radio" name="signatureMethod" value="upload">
                        Upload Signature Image
                    </label>
                    <input type="file" id="signatureUpload" accept="image/*" onchange="handleSignatureUpload(event)">
                </div>
            </div>
            
            <div class="signature-section">
                <h3>Company Stamp (Optional)</h3>
                <div class="form-group">
                    <label for="companyStamp">Upload Company Stamp:</label>
                    <input type="file" id="companyStamp" accept="image/*" onchange="handleCompanyStampUpload(event)">
                </div>
            </div>
            
            <div class="button-group">
                <button class="btn" onclick="prevStep()">PREVIOUS</button>
                <button class="btn btn-primary" onclick="submitNDA()">SUBMIT AGREEMENT</button>
            </div>
        </div>
        
        <div id="success" class="success-message hidden">
            <h2>AGREEMENT SUBMITTED SUCCESSFULLY</h2>
            <p>Your Non-Disclosure Agreement has been submitted and is under review.</p>
            <p>Reference Number: <strong>{reference_number}</strong></p>
            <p>You will receive confirmation via email shortly.</p>
        </div>
    </div>
    
    <script>
        let currentStep = 1;
        let signatureData = '';
        let companyStampData = '';
        let canvas, ctx;
        
        window.onload = function() {{
            canvas = document.getElementById('signatureCanvas');
            ctx = canvas.getContext('2d');
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            
            let isDrawing = false;
            
            canvas.addEventListener('mousedown', startDrawing);
            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('mouseup', stopDrawing);
            canvas.addEventListener('mouseout', stopDrawing);
            
            function startDrawing(e) {{
                isDrawing = true;
                ctx.beginPath();
                ctx.moveTo(e.offsetX, e.offsetY);
            }}
            
            function draw(e) {{
                if (!isDrawing) return;
                ctx.lineTo(e.offsetX, e.offsetY);
                ctx.stroke();
            }}
            
            function stopDrawing() {{
                isDrawing = false;
            }}
            
            // Generate NDA content
            generateNDAContent();
        }};
        
        function generateNDAContent() {{
            const ndaContent = `
                <h3>Confidentiality & Nondisclosure Agreement (NDA)</h3>
                <p><strong>This agreement is entered into on {datetime.now().strftime('%d, %B, %Y')}, by and among:</strong></p>
                
                <p><strong>(1)</strong> YellowStone Xperiences Pvt Ltd, a company incorporated and existing under the laws of Company Act, India, having its registered office at Plot # 2, ITC, Fourth Floor, Sector 67, Mohali -160062, Punjab, India, registered with the company registration number U72900PB2020PTC051260, hereinafter referred to as "YSXP", And</p>
                
                <p><strong>(2)</strong> {vendor['company_name']}, a company incorporated and existing under the laws of {vendor.get('company_incorporation_country', 'India')}, having its registered office at {vendor['address']}, registered with the company registration number {vendor.get('company_registration_number', 'N/A')}, hereinafter referred to as "Second Party".</p>
                
                <p><strong>WHEREAS:</strong></p>
                <p>(A) YSXP is engaged in the business of providing technology solutions and consulting services.</p>
                <p>(B) The Second Party is interested in exploring potential business opportunities with YSXP.</p>
                <p>(C) In connection with such discussions, YSXP may disclose certain confidential and proprietary information to the Second Party.</p>
                <p>(D) Both parties wish to protect their respective confidential information and establish the terms and conditions under which such information may be disclosed.</p>
                
                <p><strong>NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein, the parties agree as follows:</strong></p>
                
                <h4>1. DEFINITION OF CONFIDENTIAL INFORMATION</h4>
                <p>For purposes of this Agreement, "Confidential Information" shall mean all information, whether oral, written, or in any other form, disclosed by one party (the "Disclosing Party") to the other party (the "Receiving Party") that:</p>
                <p>(a) Is marked, designated, or otherwise identified as confidential or proprietary;</p>
                <p>(b) Would be considered confidential by a reasonable person under the circumstances;</p>
                <p>(c) Relates to the Disclosing Party's business, including but not limited to technical data, know-how, research, product plans, products, services, customers, customer lists, markets, software, developments, inventions, processes, formulas, technology, designs, drawings, engineering, hardware configuration information, marketing, finances, or other business information.</p>
                
                <h4>2. OBLIGATIONS OF RECEIVING PARTY</h4>
                <p>The Receiving Party agrees to:</p>
                <p>(a) Hold and maintain the Confidential Information in strict confidence;</p>
                <p>(b) Not disclose the Confidential Information to any third party without the prior written consent of the Disclosing Party;</p>
                <p>(c) Use the Confidential Information solely for the purpose of evaluating potential business opportunities between the parties;</p>
                <p>(d) Take reasonable precautions to protect the confidentiality of the Confidential Information;</p>
                <p>(e) Not make any copies of the Confidential Information except as necessary for the evaluation purpose.</p>
                
                <h4>3. EXCEPTIONS</h4>
                <p>The obligations set forth in Section 2 shall not apply to information that:</p>
                <p>(a) Is or becomes publicly available through no breach of this Agreement by the Receiving Party;</p>
                <p>(b) Was rightfully known by the Receiving Party prior to disclosure by the Disclosing Party;</p>
                <p>(c) Is rightfully received by the Receiving Party from a third party without breach of any confidentiality obligation;</p>
                <p>(d) Is independently developed by the Receiving Party without use of or reference to the Confidential Information.</p>
                
                <h4>4. RETURN OF INFORMATION</h4>
                <p>Upon request by the Disclosing Party, the Receiving Party shall promptly return or destroy all copies of the Confidential Information and any materials containing or derived from such information.</p>
                
                <h4>5. TERM</h4>
                <p>This Agreement shall remain in effect for a period of five (5) years from the date of execution, unless terminated earlier by mutual written consent of the parties.</p>
                
                <h4>6. GOVERNING LAW</h4>
                <p>This Agreement shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law principles.</p>
                
                <h4>7. ENTIRE AGREEMENT</h4>
                <p>This Agreement constitutes the entire agreement between the parties concerning the subject matter hereof and supersedes all prior negotiations, representations, or agreements relating thereto.</p>
                
                <p><strong>IN WITNESS WHEREOF, the parties have executed this Agreement on the date first written above by their fully authorized representatives with their free consent.</strong></p>
            `;
            
            document.getElementById('ndaContent').innerHTML = ndaContent;
        }}
        
        function nextStep() {{
            if (currentStep < 3) {{
                document.getElementById('step' + currentStep).classList.add('hidden');
                currentStep++;
                document.getElementById('step' + currentStep).classList.remove('hidden');
            }}
        }}
        
        function prevStep() {{
            if (currentStep > 1) {{
                document.getElementById('step' + currentStep).classList.add('hidden');
                currentStep--;
                document.getElementById('step' + currentStep).classList.remove('hidden');
            }}
        }}
        
        function clearSignature() {{
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            signatureData = '';
        }}
        
        function handleSignatureUpload(event) {{
            const file = event.target.files[0];
            if (file) {{
                const reader = new FileReader();
                reader.onload = function(e) {{
                    signatureData = e.target.result;
                }};
                reader.readAsDataURL(file);
            }}
        }}
        
        function handleCompanyStampUpload(event) {{
            const file = event.target.files[0];
            if (file) {{
                const reader = new FileReader();
                reader.onload = function(e) {{
                    companyStampData = e.target.result;
                }};
                reader.readAsDataURL(file);
            }}
        }}
        
        function submitNDA() {{
            // Get signature data
            const signatureMethod = document.querySelector('input[name="signatureMethod"]:checked').value;
            
            if (signatureMethod === 'draw') {{
                signatureData = canvas.toDataURL();
            }}
            
            if (!signatureData) {{
                alert('Please provide a signature before submitting.');
                return;
            }}
            
            // Collect form data from editable fields
            const formData = {{
                reference_number: '{reference_number}',
                signature_data: signatureData,
                company_stamp_data: companyStampData,
                signature_type: signatureMethod,
                contact_person: document.getElementById('contactPerson').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value
            }};
            
            // Submit the NDA
            fetch('/api/vendor/submit-nda', {{
                method: 'POST',
                headers: {{
                    'Content-Type': 'application/json',
                }},
                body: JSON.stringify(formData)
            }})
            .then(response => response.json())
            .then(data => {{
                if (data.success) {{
                    document.getElementById('step3').classList.add('hidden');
                    document.getElementById('success').classList.remove('hidden');
                }} else {{
                    alert('Error submitting NDA: ' + data.message);
                }}
            }})
            .catch(error => {{
                console.error('Error:', error);
                alert('Error submitting NDA. Please try again.');
            }});
        }}
    </script>
</body>
</html>
        """
        
        return html_content
        
    except Exception as e:
        print(f"Vendor portal error: {e}")
        return f"Error loading vendor portal: {str(e)}", 500

@app.route('/api/vendor/submit-nda', methods=['POST'])
def submit_vendor_nda():
    """Submit vendor NDA with signature"""
    try:
        data = request.get_json()
        reference_number = data.get('reference_number')
        signature_data = data.get('signature_data')
        company_stamp_data = data.get('company_stamp_data', '')
        signature_type = data.get('signature_type', 'draw')
        contact_person = data.get('contact_person', '')
        phone = data.get('phone', '')
        address = data.get('address', '')
        
        if not reference_number or not signature_data:
            return jsonify({'success': False, 'message': 'Reference number and signature are required'}), 400
        
        # Update vendor record with signature, form data, and mark as completed
        query = """
        UPDATE vendors 
        SET signature_data = %s, 
            company_stamp_data = %s, 
            signature_type = %s,
            contact_person = %s,
            phone = %s,
            address = %s,
            nda_status = 'completed',
            signed_date = NOW()
        WHERE reference_number = %s
        """
        
        execute_query(query, (signature_data, company_stamp_data, signature_type, contact_person, phone, address, reference_number))
        
        return jsonify({'success': True, 'message': 'NDA submitted successfully'})
        
    except Exception as e:
        print(f"Submit vendor NDA error: {e}")
        return jsonify({'success': False, 'message': 'Failed to submit NDA'}), 500

# React App Routes
@app.route('/')
def serve_react_app():
    """Serve the React application"""
    return send_file('frontend/build/index.html')

@app.route('/app')
def serve_react_app_alt():
    """Alternative route to serve the React application"""
    return send_file('frontend/build/index.html')

@app.route('/api/admin/templates', methods=['GET'])
def get_templates():
    """Get all templates from specialized tables"""
    try:
        all_templates = []
        
        # Get NDA templates
        nda_query = """
        SELECT t.*, a.full_name as created_by_name, 'nda' as template_type
        FROM nda_templates t 
        LEFT JOIN admins a ON t.created_by = a.id 
        ORDER BY t.created_at DESC
        """
        nda_templates = execute_query(nda_query, fetch_all=True)
        if nda_templates:
            all_templates.extend(nda_templates)
        
        # Get Contract templates
        contract_query = """
        SELECT t.*, a.full_name as created_by_name, 'contract' as template_type
        FROM contract_templates t 
        LEFT JOIN admins a ON t.created_by = a.id 
        ORDER BY t.created_at DESC
        """
        contract_templates = execute_query(contract_query, fetch_all=True)
        if contract_templates:
            all_templates.extend(contract_templates)
        
        # Get Employment templates
        employment_query = """
        SELECT t.*, a.full_name as created_by_name, 'employment' as template_type
        FROM employment_templates t 
        LEFT JOIN admins a ON t.created_by = a.id 
        ORDER BY t.created_at DESC
        """
        employment_templates = execute_query(employment_query, fetch_all=True)
        if employment_templates:
            all_templates.extend(employment_templates)
        
        # Get Vendor templates
        vendor_query = """
        SELECT t.*, a.full_name as created_by_name, 'vendor' as template_type
        FROM vendor_templates t 
        LEFT JOIN admins a ON t.created_by = a.id 
        ORDER BY t.created_at DESC
        """
        vendor_templates = execute_query(vendor_query, fetch_all=True)
        if vendor_templates:
            all_templates.extend(vendor_templates)
        
        # Get Compliance templates
        compliance_query = """
        SELECT t.*, a.full_name as created_by_name, 'compliance' as template_type
        FROM compliance_templates t 
        LEFT JOIN admins a ON t.created_by = a.id 
        ORDER BY t.created_at DESC
        """
        compliance_templates = execute_query(compliance_query, fetch_all=True)
        if compliance_templates:
            all_templates.extend(compliance_templates)
        
        # Get Custom templates
        custom_query = """
        SELECT t.*, a.full_name as created_by_name, 'custom' as template_type
        FROM custom_templates t 
        LEFT JOIN admins a ON t.created_by = a.id 
        ORDER BY t.created_at DESC
        """
        custom_templates = execute_query(custom_query, fetch_all=True)
        if custom_templates:
            all_templates.extend(custom_templates)
        
        # Sort all templates by creation date
        all_templates.sort(key=lambda x: x['created_at'], reverse=True)
        
        return jsonify({'success': True, 'templates': all_templates})
        
    except Exception as e:
        print(f"Get templates error: {e}")
        return jsonify({'error': 'Failed to get templates'}), 500

@app.route('/api/admin/templates', methods=['POST'])
def create_template():
    """Create a new template in appropriate specialized table"""
    try:
        data = request.get_json()
        
        name = data.get('name')
        description = data.get('description', '')
        template_type = data.get('template_type')
        category = data.get('category', 'general')
        priority = data.get('priority', 'medium')
        form_fields = data.get('form_fields', {})
        status = data.get('status', 'draft')
        created_by = data.get('created_by', 1)  # Default to System Administrator
        
        if not name or not template_type:
            return jsonify({'error': 'Template name and type are required'}), 400
        
        # Convert priority to match database enum values
        priority_map = {
            'low': 'low',
            'medium': 'medium',
            'high': 'high',
            'urgent': 'urgent'
        }
        db_priority = priority_map.get(priority, 'medium')
        
        # Convert status to match database enum values
        status_map = {
            'draft': 'draft',
            'active': 'active',
            'archived': 'archived'
        }
        db_status = status_map.get(status, 'draft')
        
        # Determine which table to insert into based on template_type
        table_name = f"{template_type}_templates"
        
        if template_type == 'nda':
            query = """
            INSERT INTO nda_templates (name, description, category, priority, status, created_by, 
                company_name, contact_person, email_address, phone_number, company_address, confidentiality_period)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            # Extract boolean values from form_fields
            company_name = form_fields.get('company_name', True)
            contact_person = form_fields.get('contact_person', True)
            email_address = form_fields.get('email_address', True)
            phone_number = form_fields.get('phone_number', True)
            company_address = form_fields.get('company_address', True)
            confidentiality_period = form_fields.get('confidentiality_period', True)
            
            execute_query(query, (name, description, category, db_priority, db_status, created_by,
                company_name, contact_person, email_address, phone_number, company_address, confidentiality_period))
                
        elif template_type == 'contract':
            query = """
            INSERT INTO contract_templates (name, description, category, priority, status, created_by,
                service_description, contract_duration, payment_terms, deliverables)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            service_description = form_fields.get('service_description', True)
            contract_duration = form_fields.get('contract_duration', True)
            payment_terms = form_fields.get('payment_terms', True)
            deliverables = form_fields.get('deliverables', True)
            
            execute_query(query, (name, description, category, db_priority, db_status, created_by,
                service_description, contract_duration, payment_terms, deliverables))
                
        elif template_type == 'employment':
            query = """
            INSERT INTO employment_templates (name, description, category, priority, status, created_by,
                personal_information, employment_details, emergency_contact, bank_details)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            personal_information = form_fields.get('personal_information', True)
            employment_details = form_fields.get('employment_details', True)
            emergency_contact = form_fields.get('emergency_contact', True)
            bank_details = form_fields.get('bank_details', True)
            
            execute_query(query, (name, description, category, db_priority, db_status, created_by,
                personal_information, employment_details, emergency_contact, bank_details))
                
        elif template_type == 'vendor':
            query = """
            INSERT INTO vendor_templates (name, description, category, priority, status, created_by,
                company_name, contact_person, email_address, phone_number, company_address, 
                business_license, tax_id, insurance_coverage)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            company_name = form_fields.get('company_name', True)
            contact_person = form_fields.get('contact_person', True)
            email_address = form_fields.get('email_address', True)
            phone_number = form_fields.get('phone_number', True)
            company_address = form_fields.get('company_address', True)
            business_license = form_fields.get('business_license', True)
            tax_id = form_fields.get('tax_id', True)
            insurance_coverage = form_fields.get('insurance_coverage', True)
            
            execute_query(query, (name, description, category, db_priority, db_status, created_by,
                company_name, contact_person, email_address, phone_number, company_address,
                business_license, tax_id, insurance_coverage))
                
        elif template_type == 'compliance':
            query = """
            INSERT INTO compliance_templates (name, description, category, priority, status, created_by,
                compliance_type, requirements, documentation, audit_trail)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            compliance_type = form_fields.get('compliance_type', True)
            requirements = form_fields.get('requirements', True)
            documentation = form_fields.get('documentation', True)
            audit_trail = form_fields.get('audit_trail', True)
            
            execute_query(query, (name, description, category, db_priority, db_status, created_by,
                compliance_type, requirements, documentation, audit_trail))
                
        elif template_type == 'custom':
            query = """
            INSERT INTO custom_templates (name, description, category, priority, status, created_by, custom_fields)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            execute_query(query, (name, description, category, db_priority, db_status, created_by, json.dumps(form_fields)))
            
        else:
            return jsonify({'error': 'Invalid template type'}), 400
        
        return jsonify({'success': True, 'message': 'Template created successfully'})
        
    except Exception as e:
        print(f"Create template error: {e}")
        return jsonify({'error': 'Failed to create template'}), 500

@app.route('/api/admin/templates/<int:template_id>', methods=['PUT'])
def update_template(template_id):
    """Update an existing template in appropriate specialized table"""
    try:
        data = request.get_json()
        
        name = data.get('name')
        description = data.get('description', '')
        template_type = data.get('template_type')
        category = data.get('category', 'general')
        priority = data.get('priority', 'medium')
        form_fields = data.get('form_fields', {})
        status = data.get('status', 'draft')
        
        if not name or not template_type:
            return jsonify({'error': 'Template name and type are required'}), 400
        
        # Convert priority to match database enum values
        priority_map = {
            'low': 'low',
            'medium': 'medium',
            'high': 'high',
            'urgent': 'urgent'
        }
        db_priority = priority_map.get(priority, 'medium')
        
        # Convert status to match database enum values
        status_map = {
            'draft': 'draft',
            'active': 'active',
            'archived': 'archived'
        }
        db_status = status_map.get(status, 'draft')
        
        # Update the appropriate specialized table
        if template_type == 'nda':
            query = """
            UPDATE nda_templates 
            SET name = %s, description = %s, category = %s, priority = %s, status = %s,
                company_name = %s, contact_person = %s, email_address = %s, 
                phone_number = %s, company_address = %s, confidentiality_period = %s,
                updated_at = NOW()
            WHERE id = %s
            """
            company_name = form_fields.get('company_name', True)
            contact_person = form_fields.get('contact_person', True)
            email_address = form_fields.get('email_address', True)
            phone_number = form_fields.get('phone_number', True)
            company_address = form_fields.get('company_address', True)
            confidentiality_period = form_fields.get('confidentiality_period', True)
            
            execute_query(query, (name, description, category, db_priority, db_status,
                company_name, contact_person, email_address, phone_number, 
                company_address, confidentiality_period, template_id))
                
        elif template_type == 'contract':
            query = """
            UPDATE contract_templates 
            SET name = %s, description = %s, category = %s, priority = %s, status = %s,
                service_description = %s, contract_duration = %s, payment_terms = %s, 
                deliverables = %s, updated_at = NOW()
            WHERE id = %s
            """
            service_description = form_fields.get('service_description', True)
            contract_duration = form_fields.get('contract_duration', True)
            payment_terms = form_fields.get('payment_terms', True)
            deliverables = form_fields.get('deliverables', True)
            
            execute_query(query, (name, description, category, db_priority, db_status,
                service_description, contract_duration, payment_terms, deliverables, template_id))
                
        elif template_type == 'employment':
            query = """
            UPDATE employment_templates 
            SET name = %s, description = %s, category = %s, priority = %s, status = %s,
                personal_information = %s, employment_details = %s, emergency_contact = %s, 
                bank_details = %s, updated_at = NOW()
            WHERE id = %s
            """
            personal_information = form_fields.get('personal_information', True)
            employment_details = form_fields.get('employment_details', True)
            emergency_contact = form_fields.get('emergency_contact', True)
            bank_details = form_fields.get('bank_details', True)
            
            execute_query(query, (name, description, category, db_priority, db_status,
                personal_information, employment_details, emergency_contact, bank_details, template_id))
                
        elif template_type == 'vendor':
            query = """
            UPDATE vendor_templates 
            SET name = %s, description = %s, category = %s, priority = %s, status = %s,
                company_name = %s, contact_person = %s, email_address = %s, 
                phone_number = %s, company_address = %s, business_license = %s, 
                tax_id = %s, insurance_coverage = %s, updated_at = NOW()
            WHERE id = %s
            """
            company_name = form_fields.get('company_name', True)
            contact_person = form_fields.get('contact_person', True)
            email_address = form_fields.get('email_address', True)
            phone_number = form_fields.get('phone_number', True)
            company_address = form_fields.get('company_address', True)
            business_license = form_fields.get('business_license', True)
            tax_id = form_fields.get('tax_id', True)
            insurance_coverage = form_fields.get('insurance_coverage', True)
            
            execute_query(query, (name, description, category, db_priority, db_status,
                company_name, contact_person, email_address, phone_number, company_address,
                business_license, tax_id, insurance_coverage, template_id))
                
        elif template_type == 'compliance':
            query = """
            UPDATE compliance_templates 
            SET name = %s, description = %s, category = %s, priority = %s, status = %s,
                compliance_type = %s, requirements = %s, documentation = %s, 
                audit_trail = %s, updated_at = NOW()
            WHERE id = %s
            """
            compliance_type = form_fields.get('compliance_type', True)
            requirements = form_fields.get('requirements', True)
            documentation = form_fields.get('documentation', True)
            audit_trail = form_fields.get('audit_trail', True)
            
            execute_query(query, (name, description, category, db_priority, db_status,
                compliance_type, requirements, documentation, audit_trail, template_id))
                
        elif template_type == 'custom':
            query = """
            UPDATE custom_templates 
            SET name = %s, description = %s, category = %s, priority = %s, status = %s,
                custom_fields = %s, updated_at = NOW()
            WHERE id = %s
            """
            execute_query(query, (name, description, category, db_priority, db_status, 
                json.dumps(form_fields), template_id))
            
        else:
            return jsonify({'error': 'Invalid template type'}), 400
        
        return jsonify({'success': True, 'message': 'Template updated successfully'})
        
    except Exception as e:
        print(f"Update template error: {e}")
        return jsonify({'error': 'Failed to update template'}), 500

@app.route('/api/admin/templates/<int:template_id>', methods=['DELETE'])
def delete_template(template_id):
    """Delete a template from appropriate specialized table"""
    try:
        # Try to delete from each specialized table
        tables = ['nda_templates', 'contract_templates', 'employment_templates', 
                 'vendor_templates', 'compliance_templates', 'custom_templates']
        
        deleted = False
        for table in tables:
            try:
                query = f"DELETE FROM {table} WHERE id = %s"
                result = execute_query(query, (template_id,))
                if result:
                    deleted = True
                    break
            except:
                continue
        
        if not deleted:
            return jsonify({'error': 'Template not found'}), 404
        
        return jsonify({'success': True, 'message': 'Template deleted successfully'})
        
    except Exception as e:
        print(f"Delete template error: {e}")
        return jsonify({'error': 'Failed to delete template'}), 500

@app.route('/api/admin/forms', methods=['GET'])
def get_forms():
    """Get all submitted forms"""
    try:
        query = """
        SELECT f.*, a.full_name as submitted_by_name, u.name as assigned_to_name
        FROM forms f 
        LEFT JOIN admins a ON f.submitted_by = a.id 
        LEFT JOIN users u ON f.assigned_to = u.id 
        ORDER BY f.created_at DESC
        """
        forms = execute_query(query, fetch_all=True)
        
        # Handle case where query returns None
        if forms is None:
            forms = []
        
        return jsonify({'success': True, 'forms': forms})
        
    except Exception as e:
        print(f"Get forms error: {e}")
        return jsonify({'error': 'Failed to get forms'}), 500

@app.route('/api/admin/forms', methods=['POST'])
def submit_form():
    """Submit a filled form based on a template"""
    try:
        data = request.get_json()
        
        template_id = data.get('template_id')
        template_type = data.get('template_type')
        template_name = data.get('template_name')
        filled_data = data.get('filled_data', {})
        status = data.get('status', 'submitted')
        assigned_to = data.get('assigned_to')
        due_date = data.get('due_date')
        priority = data.get('priority', 'medium')
        notes = data.get('notes', '')
        submitted_by = data.get('submitted_by', 1)  # Default to System Administrator
        
        if not template_id or not template_type or not template_name:
            return jsonify({'error': 'Template ID, type, and name are required'}), 400
        
        # Convert priority to match database enum values
        priority_map = {
            'low': 'low',
            'medium': 'medium',
            'high': 'high',
            'urgent': 'urgent'
        }
        db_priority = priority_map.get(priority, 'medium')
        
        # Convert status to match database enum values
        status_map = {
            'draft': 'draft',
            'submitted': 'submitted',
            'approved': 'approved',
            'rejected': 'rejected'
        }
        db_status = status_map.get(status, 'submitted')
        
        query = """
        INSERT INTO forms (template_id, template_type, template_name, filled_data, status, 
            submitted_by, assigned_to, due_date, priority, notes)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        execute_query(query, (template_id, template_type, template_name, json.dumps(filled_data), 
            db_status, submitted_by, assigned_to, due_date, db_priority, notes))
        
        return jsonify({'success': True, 'message': 'Form submitted successfully'})
        
    except Exception as e:
        print(f"Submit form error: {e}")
        return jsonify({'error': 'Failed to submit form'}), 500

@app.route('/api/admin/forms/<int:form_id>', methods=['PUT'])
def update_form(form_id):
    """Update an existing form"""
    try:
        data = request.get_json()
        
        status = data.get('status')
        assigned_to = data.get('assigned_to')
        due_date = data.get('due_date')
        priority = data.get('priority')
        notes = data.get('notes')
        
        # Convert priority to match database enum values
        priority_map = {
            'low': 'low',
            'medium': 'medium',
            'high': 'high',
            'urgent': 'urgent'
        }
        db_priority = priority_map.get(priority) if priority else None
        
        # Convert status to match database enum values
        status_map = {
            'draft': 'draft',
            'submitted': 'submitted',
            'approved': 'approved',
            'rejected': 'rejected'
        }
        db_status = status_map.get(status) if status else None
        
        # Build dynamic update query
        update_fields = []
        params = []
        
        if db_status is not None:
            update_fields.append("status = %s")
            params.append(db_status)
        
        if assigned_to is not None:
            update_fields.append("assigned_to = %s")
            params.append(assigned_to)
        
        if due_date is not None:
            update_fields.append("due_date = %s")
            params.append(due_date)
        
        if db_priority is not None:
            update_fields.append("priority = %s")
            params.append(db_priority)
        
        if notes is not None:
            update_fields.append("notes = %s")
            params.append(notes)
        
        if not update_fields:
            return jsonify({'error': 'No fields to update'}), 400
        
        update_fields.append("updated_at = NOW()")
        params.append(form_id)
        
        query = f"""
        UPDATE forms 
        SET {', '.join(update_fields)}
        WHERE id = %s
        """
        
        execute_query(query, params)
        
        return jsonify({'success': True, 'message': 'Form updated successfully'})
        
    except Exception as e:
        print(f"Update form error: {e}")
        return jsonify({'error': 'Failed to update form'}), 500

@app.route('/api/admin/forms/<int:form_id>', methods=['DELETE'])
def delete_form(form_id):
    """Delete a form"""
    try:
        query = "DELETE FROM forms WHERE id = %s"
        execute_query(query, (form_id,))
        
        return jsonify({'success': True, 'message': 'Form deleted successfully'})
        
    except Exception as e:
        print(f"Delete form error: {e}")
        return jsonify({'error': 'Failed to delete form'}), 500

if __name__ == '__main__':
    # Production mode
    print("Starting Flask server...")
    app.run(debug=False, host='0.0.0.0', port=8000)
