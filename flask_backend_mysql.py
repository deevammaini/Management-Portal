#!/usr/bin/env python3
# Flask backend for Yellowstone Management Portal with MySQL

from flask import Flask, jsonify, request, send_file, session, send_from_directory, redirect, make_response
from flask_cors import CORS
import os
from datetime import datetime, timedelta
import mysql.connector
from mysql.connector import Error
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
        'host': os.environ.get('DB_HOST', 'localhost'),
        'user': os.environ.get('DB_USER', 'root'),
        'password': os.environ.get('DB_PASSWORD', 'deevammaini'),
        'database': os.environ.get('DB_NAME', 'vendor_management'),
        'port': int(os.environ.get('DB_PORT', '3306')),
        'charset': 'utf8mb4',
        'collation': 'utf8mb4_unicode_ci'
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
         "http://localhost:3000",
         "http://localhost:3001",
         "http://localhost:8000",
         "http://127.0.0.1:3000",
         "http://127.0.0.1:3001",
         "http://127.0.0.1:8000",
         "http://192.168.1.1:3000",
         "http://192.168.1.1:3001",
         "http://192.168.1.1:8000"
     ])

# Configure session
app.secret_key = SECRET_KEY
app.config['SESSION_COOKIE_SECURE'] = FLASK_ENV == 'production'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Configure upload folder 
UPLOAD_FOLDER = 'uploads'
PROFILE_PHOTOS_FOLDER = 'profile_photos'
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROFILE_PHOTOS_FOLDER'] = PROFILE_PHOTOS_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

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
    year = datetime.now().strftime("%Y")
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"NDA-{year}-{random_part}"

def generate_vendor_password():
    """Generate a unique password for vendor login"""
    password_length = 12
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(characters) for _ in range(password_length))
    return password

# Database connection helper
def get_db_connection():
    """Get MySQL database connection"""
    try:
        # Attempting to connect to MySQL database
        # Database connection details
        
        import mysql.connector
        connection = mysql.connector.connect(**DB_CONFIG)
        # Database connection successful
        return connection
    except Error as e:
        print(f"❌ Error connecting to MySQL: {e}")
        print(f"❌ Connection details: {DB_CONFIG}")
        return None

def execute_query(query, params=None, fetch_one=False, fetch_all=False):
    """Execute MySQL query and return results as dictionaries"""
    connection = get_db_connection()
    if not connection:
        # No database connection available
        if fetch_all:
            return []
        return None
    
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, params)
        
        if fetch_one:
            result = cursor.fetchone()
            return result
        elif fetch_all:
            results = cursor.fetchall()
            return results if results else []
        else:
            result = None
        
        connection.commit()
        return result
    except Error as e:
        print(f"❌ MySQL query error: {e}")
        print(f"Query: {query}")
        print(f"Params: {params}")
        if fetch_all:
            return []
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
    
    clean_name = name.strip()
    name_parts = clean_name.split(' ')
    
    first_char = name_parts[0][0].upper() if name_parts[0] else 'U'
    
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
    """Get all vendors from MySQL"""
    try:
        table_check = execute_query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendors') as exists", fetch_one=True)
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
    """Get all NDA requests from MySQL"""
    try:
        table_check = execute_query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nda_requests') as exists", fetch_one=True)
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
        
        query = """
        SELECT u.*, COALESCE(m.name, '') as manager_name
        FROM users u
        LEFT JOIN users m ON u.manager = m.id
        WHERE u.employee_id = %s AND u.user_type = 'employee'
        """
        user = execute_query(query, (employee_id,), fetch_one=True)
        
        if not user:
            return jsonify({'success': False, 'message': 'Invalid employee ID'}), 401
        
        if not user['password_hash'] or user['password_hash'] == '':
            return jsonify({'success': False, 'message': 'No password set. Please register first.'}), 401
        
        if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return jsonify({'success': False, 'message': 'Invalid password'}), 401
        
        session['user_id'] = user['id']
        session['user_type'] = 'employee'
        
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

@app.route('/api/auth/temporary-login', methods=['POST'])
def temporary_login():
    """Handle temporary login for vendor registration"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password are required'}), 400
        
        email_normalized = email.strip().lower()
        print(f"[temporary-login] Attempt for email={email_normalized}")
        
        query = """
        SELECT tl.*, v.company_name as vendor_company, v.contact_person as vendor_contact, 
               v.nda_status, v.reference_number
        FROM temporary_logins tl 
        JOIN vendors v ON tl.vendor_id = v.id 
        WHERE LOWER(tl.email) = %s AND tl.is_active = 1 AND tl.expires_at > NOW()
        """
        temp_login = execute_query(query, (email_normalized,), fetch_one=True)
        
        if not temp_login:
            print(f"[temporary-login] No active temp login found for {email_normalized}")
            return jsonify({'success': False, 'message': 'Invalid credentials or expired'}), 401
        
        if not bcrypt.checkpw(password.encode('utf-8'), temp_login['password_hash'].encode('utf-8')):
            print(f"[temporary-login] Password mismatch for {email_normalized}")
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
        update_query = "UPDATE temporary_logins SET used_at = NOW() WHERE id = %s"
        execute_query(update_query, (temp_login['id'],))
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'id': temp_login['vendor_id'],
                'email': temp_login['email'],
                'company': temp_login['vendor_company'],
                'contact_person': temp_login['vendor_contact'],
                'reference_number': temp_login['reference_number'],
                'nda_status': temp_login['nda_status'],
                'user_type': 'temp_vendor',
                'is_temporary': True
            }
        })
        
    except Exception as e:
        print(f"Temporary login error: {e}")
        return jsonify({'success': False, 'message': 'Login failed'}), 500

@app.route('/api/auth/vendor-login', methods=['POST'])
def vendor_login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password are required'}), 400
        
        query = """
        SELECT vl.id, vl.vendor_id, vl.email, vl.password_hash, vl.company_name, vl.contact_person, 
               vl.phone, vl.address, vl.is_active, vl.created_at, vl.last_login,
               v.company_name as vendor_company, v.contact_person as vendor_contact, 
               v.portal_access, v.nda_status, v.reference_number, vr.status as registration_status
        FROM vendor_logins vl 
        JOIN vendors v ON vl.vendor_id = v.id 
        LEFT JOIN vendor_registrations vr ON vr.email = vl.email
        WHERE vl.email = %s AND vl.is_active = 1
        """
        vendor = execute_query(query, (email,), fetch_one=True)
        
        if not vendor:
            return jsonify({'success': False, 'message': 'Invalid email or password'}), 401
        
        if not bcrypt.checkpw(password.encode('utf-8'), vendor['password_hash'].encode('utf-8')):
            return jsonify({'success': False, 'message': 'Invalid email or password'}), 401
        
        update_query = "UPDATE vendor_logins SET last_login = NOW() WHERE id = %s"
        execute_query(update_query, (vendor['id'],))
        
        session['user_id'] = vendor['vendor_id']
        session['user_type'] = 'vendor'
        
        CURRENT_USER.update({
            'id': vendor['vendor_id'],
            'name': vendor['vendor_company'],
            'email': vendor['email'],
            'company': vendor['vendor_company'],
            'contact_person': vendor['vendor_contact'],
            'user_type': 'vendor'
        })
        
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
                'nda_status': vendor['nda_status'],
                'reference_number': vendor['reference_number']
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
        
        query = "SELECT id FROM admins WHERE email = %s OR username = %s"
        existing_admin = execute_query(query, (email, username), fetch_one=True)
        
        if existing_admin:
            return jsonify({'success': False, 'message': 'Admin with this email or username already exists'}), 400
        
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
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
        
        query = "SELECT id, password_hash FROM users WHERE email = %s OR employee_id = %s"
        existing_user = execute_query(query, (email, employee_id), fetch_one=True)
        
        if existing_user:
            if not existing_user['password_hash']:
                password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                
                update_query = """
                UPDATE users 
                SET password_hash = %s, updated_at = NOW()
                WHERE id = %s
                """
                execute_query(update_query, (password_hash, existing_user['id']))
                
                return jsonify({'success': True, 'message': 'Employee account created successfully'})
            else:
                return jsonify({'success': False, 'message': 'An account already exists for this employee. Please use the login page or contact your administrator to reset your password.'}), 400
        
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
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
        
        query = "SELECT id FROM vendors WHERE email = %s"
        existing_vendor = execute_query(query, (email,), fetch_one=True)
        
        if existing_vendor:
            return jsonify({'success': False, 'message': 'Vendor with this email already exists'}), 400
        
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        query = """
        INSERT INTO vendors (email, company_name, contact_person, phone, address, nda_status)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        vendor_id = execute_query(query, (email, company_name, contact_person, phone, address, 'pending'))
        
        if vendor_id:
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
        
        query = "SELECT * FROM admins WHERE (email = %s OR username = %s) AND is_active = 1"
        admin = execute_query(query, (username, username), fetch_one=True)
        
        if not admin:
            return jsonify({'success': False, 'message': 'Invalid username or password'}), 401
        
        if not bcrypt.checkpw(password.encode('utf-8'), admin['password_hash'].encode('utf-8')):
            return jsonify({'success': False, 'message': 'Invalid username or password'}), 401
        
        update_query = "UPDATE admins SET last_login = NOW() WHERE id = %s"
        execute_query(update_query, (admin['id'],))
        
        session['user_id'] = admin['id']
        session['user_type'] = 'admin'
        
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
@app.route('/api/test/send-nda', methods=['POST'])
def test_send_nda():
    """Test endpoint for NDA sending functionality"""
    try:
        print("🔍 Testing NDA send functionality...")
        
        test_query = "SELECT COUNT(*) FROM vendors"
        result = execute_query(test_query, fetch_one=True)
        if result is None:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500
        
        print(f"✅ Database connection working - {result['count']} vendors found")
        
        print(f"🔍 SMTP Configuration:")
        print(f"  Server: {SMTP_SERVER}")
        print(f"  Port: {SMTP_PORT}")
        print(f"  Username: {SMTP_USERNAME}")
        print(f"  Password: {'*' * len(SMTP_PASSWORD) if SMTP_PASSWORD else 'NOT SET'}")
        
        try:
            msg = MIMEMultipart()
            msg['From'] = SMTP_USERNAME
            msg['To'] = 'test@example.com'
            msg['Subject'] = 'Test NDA Email'
            msg.attach(MIMEText('Test email body', 'plain'))
            
            print("✅ Email message created successfully")
            
        except Exception as email_test_error:
            print(f"❌ Email message creation failed: {email_test_error}")
            return jsonify({'success': False, 'error': f'Email configuration error: {str(email_test_error)}'}), 500
        
        return jsonify({
            'success': True, 
            'message': 'NDA functionality test passed',
            'database_status': 'connected',
            'email_status': 'configured',
            'vendor_count': result['count']
        })
        
    except Exception as e:
        print(f"❌ Test NDA error: {e}")
        return jsonify({'success': False, 'error': f'Test failed: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to test database connection"""
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({
                'status': 'error',
                'message': 'Database connection failed',
                'database': 'disconnected'
            }), 500
        
        result = execute_query("SELECT 1 as test", fetch_one=True)
        if not result:
            return jsonify({
                'status': 'error',
                'message': 'Database query failed',
                'database': 'connected_but_query_failed'
            }), 500
        
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
    """Get dashboard statistics with proper error handling"""
    try:
        tasks_count = execute_query("SELECT COUNT(*) as count FROM tasks", fetch_one=True)
        projects_count = execute_query("SELECT COUNT(*) as count FROM projects", fetch_one=True)
        workflows_count = execute_query("SELECT COUNT(*) as count FROM workflows", fetch_one=True)
        tickets_count = execute_query("SELECT COUNT(*) as count FROM tickets", fetch_one=True)
        users_count = execute_query("SELECT COUNT(*) as count FROM users", fetch_one=True)
        
        return jsonify({
            'total_tasks': tasks_count['count'] if tasks_count else 0,
            'total_projects': projects_count['count'] if projects_count else 0,
            'total_workflows': workflows_count['count'] if workflows_count else 0,
            'total_tickets': tickets_count['count'] if tickets_count else 0,
            'active_users': users_count['count'] if users_count else 0
        })
        
    except Exception as e:
        return jsonify({
            'total_tasks': 0,
            'total_projects': 0,
            'total_workflows': 0,
            'total_tickets': 0,
            'active_users': 0
        })

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
        LEFT JOIN users m ON u.manager = m.id
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
        
        user_query = "SELECT id FROM users WHERE employee_id = %s AND user_type = 'employee'"
        user = execute_query(user_query, (employee_id,), fetch_one=True)
        
        if not user:
            return jsonify({'error': 'Employee not found'}), 404
        
        from datetime import datetime, time, date
        
        current_time = datetime.now()
        current_date = current_time.date()
        current_time_only = current_time.time()
        
        check_query = "SELECT id, clock_in_time FROM attendance WHERE employee_id = %s AND date = %s"
        existing = execute_query(check_query, (user['id'], current_date), fetch_one=True)
        
        if existing and existing['clock_in_time']:
            return jsonify({'error': 'Already clocked in today'}), 400
        
        late_threshold = time(10, 0)
        half_day_threshold = time(10, 30)
        
        if current_time_only <= late_threshold:
            status = 'Present'
            late_minutes = 0
        elif current_time_only <= half_day_threshold:
            status = 'Late'
            late_minutes = int((current_time_only.hour - 9) * 60 + current_time_only.minute - 30)
        else:
            status = 'Half Day'
            late_minutes = int((current_time_only.hour - 9) * 60 + current_time_only.minute - 30)
        
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
        
        user_query = "SELECT id FROM users WHERE employee_id = %s AND user_type = 'employee'"
        user = execute_query(user_query, (employee_id,), fetch_one=True)
        
        if not user:
            return jsonify({'error': 'Employee not found'}), 404
        
        from datetime import datetime, time, date
        
        current_time = datetime.now()
        current_date = current_time.date()
        current_time_only = current_time.time()
        
        check_query = "SELECT id, clock_in_time, status FROM attendance WHERE employee_id = %s AND date = %s"
        attendance = execute_query(check_query, (user['id'], current_date), fetch_one=True)
        
        if not attendance or not attendance['clock_in_time']:
            return jsonify({'error': 'Please clock in first'}), 400
        
        if attendance['clock_out_time']:
            return jsonify({'error': 'Already clocked out today'}), 400
        
        clock_in_time = attendance['clock_in_time']
        total_minutes = (current_time_only.hour - clock_in_time.hour) * 60 + (current_time_only.minute - clock_in_time.minute)
        total_hours = round(total_minutes / 60, 2)
        
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
        
        user_query = "SELECT id FROM users WHERE employee_id = %s AND user_type = 'employee'"
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
        
        user_query = "SELECT id FROM users WHERE employee_id = %s AND user_type = 'employee'"
        user = execute_query(user_query, (employee_id,), fetch_one=True)
        
        if not user:
            return jsonify({'error': 'Employee not found'}), 404
        
        from datetime import date, datetime
        
        if month and year:
            query = """
            SELECT date, clock_in_time, clock_out_time, status, total_hours, late_minutes
            FROM attendance 
            WHERE employee_id = %s AND YEAR(date) = %s AND MONTH(date) = %s
            ORDER BY date DESC
            """
            attendance_records = execute_query(query, (user['id'], year, month), fetch_all=True)
        else:
            current_date = date.today()
            query = """
            SELECT date, clock_in_time, clock_out_time, status, total_hours, late_minutes
            FROM attendance 
            WHERE employee_id = %s AND YEAR(date) = %s AND MONTH(date) = %s
            ORDER BY date DESC
            """
            attendance_records = execute_query(query, (user['id'], current_date.year, current_date.month), fetch_all=True)
        
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
        
        print(f"Received registration data: {data}")
        
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
        
        print(f"Extracted fields - Company: {company_name}, Contact: {contact_person}, Email: {email}")
        
        required_fields = [
            company_name, contact_person, email, phone, address, business_type, services, experience
        ]
        
        if not all(required_fields):
            missing_fields = [field for field, value in zip(['company_name', 'contact_person', 'email', 'phone', 'address', 'business_type', 'services', 'experience'], required_fields) if not value]
            print(f"Missing required fields: {missing_fields}")
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        
        check_query = "SELECT id FROM vendor_registrations WHERE email = %s"
        existing = execute_query(check_query, (email,), fetch_one=True)
        
        if existing:
            print(f"Vendor with email {email} already exists")
            return jsonify({'error': 'Vendor with this email already registered'}), 400
        
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
        query = "SELECT * FROM vendor_registrations WHERE id = %s"
        registration = execute_query(query, (registration_id,), fetch_one=True)
        
        if not registration:
            return jsonify({'success': False, 'message': 'Registration not found'}), 404
        
        if registration['status'] != 'pending':
            return jsonify({'success': False, 'message': 'Registration is not pending'}), 400
        
        update_query = "UPDATE vendor_registrations SET status = 'approved', updated_at = NOW() WHERE id = %s"
        execute_query(update_query, (registration_id,))
        
        vendor_password = generate_vendor_password()
        password_hash = bcrypt.hashpw(vendor_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
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
            login_query = """
            INSERT INTO vendor_logins (vendor_id, email, password_hash, company_name, contact_person, phone, address, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            execute_query(login_query, (
                vendor_id, registration['email'], password_hash,
                registration['company_name'], registration['contact_person'],
                registration['phone'], registration['address'], True
            ))
            
            check_query = "SELECT id FROM users WHERE email = %s"
            existing_user = execute_query(check_query, (registration['email'],), fetch_one=True)
            
            if existing_user:
                user_query = """
                UPDATE users SET password_hash = %s, user_type = %s, updated_at = %s
                WHERE email = %s
                """
                execute_query(user_query, (password_hash, 'vendor', datetime.now(), registration['email']))
            else:
                user_query = """
                INSERT INTO users (email, password_hash, name, user_type, created_at)
                VALUES (%s, %s, %s, %s, %s)
                """
                execute_query(user_query, (
                    registration['email'], password_hash, registration['contact_person'], 'vendor', datetime.now()
                ))
        
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
        query = "SELECT * FROM vendor_registrations WHERE id = %s"
        registration = execute_query(query, (registration_id,), fetch_one=True)
        
        if not registration:
            return jsonify({'success': False, 'message': 'Registration not found'}), 404
        
        if registration['status'] != 'pending':
            return jsonify({'success': False, 'message': 'Registration is not pending'}), 400
        
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
        password = data.get('password', 'temp123')
        
        if not all([name, email, employee_id, position, department]):
            return jsonify({'success': False, 'message': 'Name, email, employee ID, position, and department are required'}), 400
        
        query = "SELECT id FROM users WHERE email = %s OR employee_id = %s"
        existing = execute_query(query, (email, employee_id), fetch_one=True)
        if existing:
            return jsonify({'success': False, 'message': 'Employee with this email or employee ID already exists'}), 400
        
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
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
        
        if not all([name, email, employee_id_new, position, department]):
            return jsonify({'success': False, 'message': 'Name, email, employee ID, position, and department are required'}), 400
        
        query = "SELECT id FROM users WHERE (email = %s OR employee_id = %s) AND id != %s"
        existing = execute_query(query, (email, employee_id_new, employee_id), fetch_one=True)
        if existing:
            return jsonify({'success': False, 'message': 'Email or employee ID already exists for another employee'}), 400
        
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
        query = "SELECT id FROM users WHERE id = %s AND user_type = 'employee'"
        employee = execute_query(query, (employee_id,), fetch_one=True)
        if not employee:
            return jsonify({'success': False, 'message': 'Employee not found'}), 404
        
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
        query = "SELECT COUNT(*) as total FROM users WHERE user_type = 'employee'"
        total_employees = execute_query(query, fetch_one=True)['total']
        
        query = "SELECT COUNT(*) as active FROM users WHERE user_type = 'employee' AND status = 'active'"
        active_employees = execute_query(query, fetch_one=True)['active']
        
        query = "SELECT COUNT(DISTINCT department) as dept_count FROM users WHERE user_type = 'employee' AND department IS NOT NULL"
        departments = execute_query(query, fetch_one=True)['dept_count']
        
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
        created_by = data.get('created_by', 1)
        
        if not title:
            return jsonify({'error': 'Task title is required'}), 400
        
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
        created_by = data.get('created_by', 1)
        
        if not name:
            return jsonify({'error': 'Project name is required'}), 400
        
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
        
        if not created_by:
            user_query = "SELECT MIN(id) FROM users"
            first_user = execute_query(user_query, fetch_one=True)
            created_by = first_user['MIN(id)'] if first_user and first_user['MIN(id)'] else None
        
        if not created_by:
            return jsonify({'error': 'No valid user found to assign as creator'}), 400
        
        if not title:
            return jsonify({'error': 'Ticket title is required'}), 400
        
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

# Employee routes and additional endpoints continue below...
# (The rest of your existing code for employee notifications, vendor NDA submission, etc.)

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

# Admin routes
@app.route('/api/admin/nda-forms', methods=['GET'])
def get_admin_nda_forms():
    """Get all NDA forms for admin view"""
    try:
        query = """
        SELECT 
            nf.id,
            JSON_UNQUOTE(JSON_EXTRACT(nf.form_data, '$.company_name')) as company_name,
            JSON_UNQUOTE(JSON_EXTRACT(nf.form_data, '$.contact_person')) as contact_person,
            JSON_UNQUOTE(JSON_EXTRACT(nf.form_data, '$.email')) as email,
            JSON_UNQUOTE(JSON_EXTRACT(nf.form_data, '$.phone')) as phone,
            JSON_UNQUOTE(JSON_EXTRACT(nf.form_data, '$.address')) as address,
            JSON_UNQUOTE(JSON_EXTRACT(nf.form_data, '$.business_type')) as business_type,
            JSON_UNQUOTE(JSON_EXTRACT(nf.form_data, '$.registration_number')) as company_registration_number,
            JSON_UNQUOTE(JSON_EXTRACT(nf.form_data, '$.country')) as company_incorporation_country,
            JSON_UNQUOTE(JSON_EXTRACT(nf.form_data, '$.state')) as company_incorporation_state,
            JSON_UNQUOTE(JSON_EXTRACT(nf.form_data, '$.signature_data')) as signature_data,
            JSON_UNQUOTE(JSON_EXTRACT(nf.form_data, '$.company_stamp_data')) as company_stamp_data,
            JSON_UNQUOTE(JSON_EXTRACT(nf.form_data, '$.signature_type')) as signature_type,
            JSON_UNQUOTE(JSON_EXTRACT(nf.form_data, '$.reference_number')) as reference_number,
            nf.status as nda_status,
            nf.signed_at as signed_date,
            nf.created_at,
            nf.updated_at,
            v.portal_access,
            v.has_full_access,
            CASE 
                WHEN JSON_UNQUOTE(JSON_EXTRACT(nf.form_data, '$.signature_data')) IS NOT NULL 
                     AND JSON_UNQUOTE(JSON_EXTRACT(nf.form_data, '$.signature_data')) != '' 
                     AND JSON_UNQUOTE(JSON_EXTRACT(nf.form_data, '$.signature_data')) != 'null'
                THEN 1
                ELSE 0
            END as has_signature,
            CASE 
                WHEN JSON_UNQUOTE(JSON_EXTRACT(nf.form_data, '$.company_stamp_data')) IS NOT NULL 
                     AND JSON_UNQUOTE(JSON_EXTRACT(nf.form_data, '$.company_stamp_data')) != '' 
                     AND JSON_UNQUOTE(JSON_EXTRACT(nf.form_data, '$.company_stamp_data')) != 'null'
                THEN 1
                ELSE 0
            END as has_company_stamp,
            CASE 
                WHEN v.portal_access = 1 THEN 'Granted'
                ELSE 'Pending'
            END as portal_access_status
        FROM nda_forms nf
        JOIN vendors v ON nf.vendor_id = v.id
        WHERE nf.status = 'signed'
        ORDER BY nf.created_at DESC
        """
        nda_forms = execute_query(query, fetch_all=True)
        
        if nda_forms is None:
            return jsonify([])
        return jsonify(nda_forms)
        
    except Exception as e:
        return jsonify([])

@app.route('/api/admin/vendors', methods=['GET'])
def get_admin_vendors():
    """Get all vendors with proper error handling"""
    try:
        vendors = execute_query("SELECT * FROM vendors", fetch_all=True)
        
        if vendors is None:
            return jsonify([])
        
        if len(vendors) == 0:
            return jsonify([])
        return jsonify(vendors)
        
    except Exception as e:
        return jsonify([])

@app.route('/api/admin/templates', methods=['GET'])
def get_admin_templates():
    """Get all form templates for admin view"""
    try:
        # For now, return empty templates array since we don't have a templates table yet
        # This will prevent the "Failed to load templates" error
        return jsonify({
            'success': True,
            'templates': []
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/admin/submitted-nda-forms', methods=['GET'])
def get_submitted_nda_forms():
    """Get submitted NDA forms for admin dashboard"""
    try:
        query = """
        SELECT v.id, v.company_name, v.contact_person, v.email, v.phone, v.address,
               v.nda_status, v.reference_number, v.signature_data, v.company_stamp_data,
               v.signature_type, v.signed_date, v.created_at, v.updated_at
        FROM vendors v
        WHERE v.nda_status IN ('completed', 'sent')
        ORDER BY v.created_at DESC
        """
        nda_forms = execute_query(query, fetch_all=True)
        return jsonify(nda_forms or [])
        
    except Exception as e:
        return jsonify([])

@app.route('/api/admin/send-completed-nda-email', methods=['POST'])
def send_completed_nda_email():
    """Send email notification for completed NDA"""
    try:
        data = request.get_json()
        form_id = data.get('formId')
        
        if not form_id:
            return jsonify({'success': False, 'message': 'Form ID is required'}), 400
        
        query = "SELECT * FROM vendors WHERE id = %s"
        vendor = execute_query(query, (form_id,), fetch_one=True)
        
        if not vendor:
            return jsonify({'success': False, 'message': 'Vendor not found'}), 404
        
        # Send completion email
        try:
            msg = MIMEMultipart()
            msg['From'] = SMTP_USERNAME
            msg['To'] = vendor['email']
            msg['Subject'] = f"NDA Completion Confirmation - {vendor['company_name']}"
            
            body = f"""
Dear {vendor['contact_person']},

Your NDA has been successfully completed and processed.

Company: {vendor['company_name']}
Reference Number: {vendor['reference_number']}
Completion Date: {vendor['signed_date']}

Thank you for your cooperation.

Best regards,
YellowStone Xperiences Team
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            text = msg.as_string()
            server.sendmail(SMTP_USERNAME, vendor['email'], text)
            server.quit()
            
            return jsonify({'success': True, 'message': 'Completion email sent successfully'})
            
        except Exception as email_error:
            print(f"Email sending failed: {email_error}")
            return jsonify({'success': False, 'message': 'Failed to send email'}), 500
        
    except Exception as e:
        print(f"Send completed NDA email error: {e}")
        return jsonify({'success': False, 'message': 'Failed to send email'}), 500

@app.route('/api/admin/send-bulk-nda', methods=['POST'])
def send_bulk_nda():
    """Send NDA to multiple vendors"""
    try:
        data = request.get_json()
        vendors = data.get('vendors', [])
        
        if not vendors:
            return jsonify({'success': False, 'message': 'No vendors selected'}), 400
        
        results = []
        for vendor in vendors:
            try:
                reference_number = generate_reference_number()
                
                # Update or create vendor record
                check_query = "SELECT id FROM vendors WHERE email = %s"
                existing_vendor = execute_query(check_query, (vendor['email'],), fetch_one=True)
                
                if existing_vendor:
                    update_query = """
                    UPDATE vendors SET company_name = %s, reference_number = %s, nda_status = 'sent', updated_at = NOW()
                    WHERE email = %s
                    """
                    execute_query(update_query, (vendor['company_name'], reference_number, vendor['email']))
                else:
                    insert_query = """
                    INSERT INTO vendors (email, company_name, nda_status, reference_number, created_at)
                    VALUES (%s, %s, 'sent', %s, NOW())
                    """
                    execute_query(insert_query, (vendor['email'], vendor['company_name'], reference_number))
                
                # Send email
                try:
                    msg = MIMEMultipart()
                    msg['From'] = SMTP_USERNAME
                    msg['To'] = vendor['email']
                    msg['Subject'] = f"NDA Agreement Request - {vendor['company_name']} (Ref: {reference_number})"
                    
                    body = f"""
Dear Sir/Madam,

Subject: Invitation to Complete Non-Disclosure Agreement - Strategic Partnership Opportunity

YellowStone Xperiences Pvt Ltd is pleased to extend an invitation to {vendor['company_name']} to participate in our Strategic Partnership Program.

REFERENCE NUMBER: {reference_number}

To facilitate this process, we have prepared a comprehensive NDA form that can be completed electronically through our secure portal:

NDA FORM: http://localhost:8000/nda-form?ref={reference_number}

IMPORTANT INSTRUCTIONS:
- Please complete all required fields accurately
- Ensure all company information is current and verified
- Digital signature is required for document execution
- Company stamp upload is optional but recommended

Should you have any questions or require assistance, please contact our Vendor Relations Department.

We look forward to establishing a mutually beneficial partnership.

Yours faithfully,

Harpreet Singh
CEO
YellowStone Xperiences Pvt Ltd
                    """
                    
                    msg.attach(MIMEText(body, 'plain'))
                    
                    server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
                    server.starttls()
                    server.login(SMTP_USERNAME, SMTP_PASSWORD)
                    text = msg.as_string()
                    server.sendmail(SMTP_USERNAME, vendor['email'], text)
                    server.quit()
                    
                    results.append({'email': vendor['email'], 'status': 'success', 'reference': reference_number})
                    
                except Exception as email_error:
                    results.append({'email': vendor['email'], 'status': 'email_failed', 'reference': reference_number, 'error': str(email_error)})
                    
            except Exception as vendor_error:
                results.append({'email': vendor['email'], 'status': 'failed', 'error': str(vendor_error)})
        
        return jsonify({'success': True, 'message': 'Bulk NDA processing completed', 'results': results})
        
    except Exception as e:
        print(f"Send bulk NDA error: {e}")
        return jsonify({'success': False, 'message': 'Failed to process bulk NDA'}), 500

@app.route('/api/admin/notifications', methods=['GET'])
def get_admin_notifications():
    """Get notifications for admin dashboard"""
    try:
        query = """
        SELECT id, title, message, type, is_read, created_at
        FROM notifications
        ORDER BY created_at DESC
        LIMIT 50
        """
        notifications = execute_query(query, fetch_all=True)
        
        return jsonify({
            'success': True,
            'notifications': notifications or []
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'notifications': []
        })

@app.route('/api/webhook/google-form', methods=['POST'])
def google_form_webhook():
    """Receive Google Form submissions and store them as NDA forms"""
    try:
        data = request.get_json()
        
        # Extract form data
        reference_number = data.get('reference_number', '')
        company_name = data.get('company_name', '')
        contact_person = data.get('contact_person', '')
        email = data.get('email', '')
        phone = data.get('phone', '')
        address = data.get('address', '')
        business_type = data.get('business_type', '')
        registration_number = data.get('registration_number', '')
        country = data.get('country', '')
        state = data.get('state', '')
        signature_data = data.get('signature_data', '')
        company_stamp_data = data.get('company_stamp_data', '')
        signature_type = data.get('signature_type', 'draw')
        # Handle timestamp properly
        timestamp_str = data.get('timestamp', '')
        if timestamp_str:
            try:
                # Parse ISO format timestamp from frontend
                submission_timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            except:
                submission_timestamp = datetime.now()
        else:
            submission_timestamp = datetime.now()
        
        print(f"🔍 Received Google Form submission for reference: {reference_number}")
        print(f"🔍 Timestamp received: {timestamp_str}")
        print(f"🔍 Parsed timestamp: {submission_timestamp}")
        
        # Find existing vendor by reference number
        vendor_query = "SELECT id FROM vendors WHERE reference_number = %s"
        vendor = execute_query(vendor_query, (reference_number,), fetch_one=True)
        
        if not vendor:
            print(f"❌ Vendor not found for reference: {reference_number}")
            return jsonify({'success': False, 'message': 'Vendor not found'}), 404
        
        vendor_id = vendor[0]
        
        # Prepare form data as JSON
        form_data = {
            "company_name": company_name,
            "contact_person": contact_person,
            "email": email,
            "phone": phone,
            "address": address,
            "business_type": business_type,
            "registration_number": registration_number,
            "country": country,
            "state": state,
            "signature_data": signature_data,
            "company_stamp_data": company_stamp_data,
            "signature_type": signature_type,
            "reference_number": reference_number
        }
        
        # Check if NDA form already exists for this vendor
        existing_nda_query = "SELECT id FROM nda_forms WHERE vendor_id = %s"
        existing_nda = execute_query(existing_nda_query, (vendor_id,), fetch_one=True)
        
        if existing_nda:
            # Update existing NDA form
            update_query = """
            UPDATE nda_forms 
            SET form_data = %s, status = 'signed', signed_at = %s, updated_at = NOW()
            WHERE vendor_id = %s
            """
            
            try:
                execute_query(update_query, (
                    json.dumps(form_data), submission_timestamp, vendor_id
                ))
                print(f"✅ NDA form updated for vendor {vendor_id}")
            except Exception as db_error:
                print(f"❌ Database update error: {db_error}")
                return jsonify({'success': False, 'message': f'Database error: {str(db_error)}'}), 500
        else:
            # Create new NDA form
            insert_query = """
            INSERT INTO nda_forms (vendor_id, form_data, status, signed_at, created_at, updated_at)
            VALUES (%s, %s, 'signed', %s, NOW(), NOW())
            """
            
            try:
                execute_query(insert_query, (
                    vendor_id, json.dumps(form_data), submission_timestamp
                ))
                print(f"✅ New NDA form created for vendor {vendor_id}")
            except Exception as db_error:
                print(f"❌ Database insert error: {db_error}")
                return jsonify({'success': False, 'message': f'Database error: {str(db_error)}'}), 500
        
        # Also update vendor status
        vendor_update_query = """
        UPDATE vendors 
        SET nda_status = 'completed', signed_date = %s, updated_at = NOW()
        WHERE id = %s
        """
        
        try:
            execute_query(vendor_update_query, (submission_timestamp, vendor_id))
            print(f"✅ Vendor status updated for {company_name}")
        except Exception as db_error:
            print(f"⚠️ Vendor status update error: {db_error}")
        
        return jsonify({
            'success': True, 
            'message': 'NDA form submission received and processed successfully'
        })
        
    except Exception as e:
        print(f"❌ Google Form webhook error: {e}")
        return jsonify({'success': False, 'message': 'Failed to process form submission'}), 500

@app.route('/api/admin/send-nda', methods=['POST'])
def send_nda():
    """Send NDA to vendor with proper error handling"""
    try:
        data = request.get_json()
        email = data.get('email')
        company_name = data.get('company_name')
        
        print(f"🔍 NDA Send Request: email={email}, company={company_name}")
        
        if not email:
            print("❌ Email is required")
            return jsonify({'success': False, 'error': 'Email is required'}), 400
        
        reference_number = generate_reference_number()
        print(f"🔍 Generated reference number: {reference_number}")
        
        check_query = "SELECT id FROM vendors WHERE email = %s"
        existing_vendor = execute_query(check_query, (email,), fetch_one=True)
        
        if existing_vendor:
            print(f"🔍 Updating existing vendor: {existing_vendor['id']}")
            query = """
            UPDATE vendors SET company_name = %s, reference_number = %s, updated_at = %s
            WHERE email = %s
            """
            result = execute_query(query, (company_name, reference_number, datetime.now(), email))
            print(f"✅ Vendor update query executed successfully")
        else:
            print(f"🔍 Creating new vendor")
            query = """
            INSERT INTO vendors (email, company_name, nda_status, reference_number, created_at)
            VALUES (%s, %s, %s, %s, %s)
            """
            result = execute_query(query, (email, company_name, 'sent', reference_number, datetime.now()))
            print(f"✅ Vendor insert query executed successfully")
        
        print(f"✅ Vendor record saved successfully")
        
        try:
            msg = MIMEMultipart()
            msg['From'] = SMTP_USERNAME
            msg['To'] = email
            msg['Subject'] = f"NDA Agreement Request - {company_name} (Ref: {reference_number})"
            
            body = f"""
Dear Sir/Madam,

Subject: Invitation to Complete Non-Disclosure Agreement - Strategic Partnership Opportunity

We hope this correspondence finds you in good health and prosperity.

YellowStone Xperiences Pvt Ltd is pleased to extend an invitation to {company_name} to participate in our Strategic Partnership Program.

REFERENCE NUMBER: {reference_number}

To facilitate this process, we have prepared a comprehensive NDA form that can be completed electronically through our secure portal:

NDA FORM LINK: http://localhost:8000/nda-form?ref={reference_number}

IMPORTANT INSTRUCTIONS:
- Please complete all required fields accurately
- Ensure all company information is current and verified
- Digital signature is required for document execution
- Company stamp upload is optional but recommended

Should you have any questions or require assistance, please contact our Vendor Relations Department.

We look forward to establishing a mutually beneficial partnership.

Yours faithfully,

Harpreet Singh
CEO
YellowStone Xperiences Pvt Ltd
Email: Harpreet.singh@yellowstonexps.com
Address: Plot # 2, ITC, Fourth Floor, Sector 67, Mohali -160062, Punjab, India
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            print(f"🔍 Attempting to send email to {email}")
            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            text = msg.as_string()
            server.sendmail(SMTP_USERNAME, email, text)
            server.quit()
            
            print(f"✅ NDA email sent successfully to {email} with reference {reference_number}")
            
        except Exception as email_error:
            print(f"❌ Email sending failed: {email_error}")
            return jsonify({'success': True, 'message': 'NDA recorded but email delivery failed', 'reference_number': reference_number, 'email_error': str(email_error)})
        
        return jsonify({'success': True, 'message': 'NDA sent successfully', 'reference_number': reference_number})
    except Exception as e:
        print(f"❌ Send NDA error: {e}")
        return jsonify({'success': False, 'error': f'Failed to send NDA: {str(e)}'}), 500

# Static file serving
@app.route('/static/css/<path:filename>')
def serve_css(filename):
    """Serve CSS files from the React build"""
    return send_from_directory('frontend/build/static/css', filename)

@app.route('/static/js/<path:filename>')
def serve_js(filename):
    """Serve JS files from the React build"""
    return send_from_directory('frontend/build/static/js', filename)

@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve other static files from the React build"""
    return send_from_directory('frontend/build/static', filename)

# React App Routes
@app.route('/nda-form')
def serve_nda_form():
    """Serve the custom NDA form"""
    return send_file('frontend/build/nda-form.html')

@app.route('/nda-signature')
def serve_nda_signature():
    """Serve the NDA signature page"""
    return send_file('frontend/build/nda-signature.html')

@app.route('/vendor-portal')
def serve_vendor_portal():
    """Serve the vendor portal React application"""
    return send_file('frontend/build/index.html')

@app.route('/')
def serve_react_app():
    """Serve the React application"""
    return send_file('frontend/build/index.html')

@app.route('/app')
def serve_react_app_alt():
    """Alternative route to serve the React application"""
    return send_file('frontend/build/index.html')

if __name__ == '__main__':
    print("Starting Flask server...")
    app.run(debug=False, host='0.0.0.0', port=8000)