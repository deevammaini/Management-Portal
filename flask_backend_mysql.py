#!/usr/bin/env python3
# Flask backend for Yellowstone Management Portal with MySQL

from flask import Flask, jsonify, request, send_file, session, send_from_directory, redirect, make_response
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
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

# Initialize SocketIO for real-time updates
socketio = SocketIO(app, cors_allowed_origins=[
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
        
        user_query = "SELECT id FROM users WHERE id = %s AND user_type = 'employee'"
        user = execute_query(user_query, (employee_id,), fetch_one=True)
        
        if not user:
            return jsonify({'error': 'Employee not found'}), 404
        
        from datetime import datetime, time, date
        
        current_time = datetime.now()
        current_date = current_time.date()
        current_time_only = current_time.time()
        
        check_query = "SELECT id, clock_in_time, clock_out_time FROM attendance WHERE employee_id = %s AND date = %s"
        existing = execute_query(check_query, (employee_id, current_date), fetch_one=True)
        
        # Allow clock-in if no existing record OR if already clocked out
        if existing and existing['clock_in_time'] and not existing['clock_out_time']:
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
            # If clocked out, reset clock_out_time to null and update clock_in_time
            update_query = """
            UPDATE attendance 
            SET clock_in_time = %s, clock_out_time = NULL, status = %s, late_minutes = %s, total_hours = 0, updated_at = NOW()
            WHERE id = %s
            """
            execute_query(update_query, (current_time_only, status, late_minutes, existing['id']))
        else:
            insert_query = """
            INSERT INTO attendance (employee_id, date, clock_in_time, status, late_minutes, created_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
            """
            execute_query(insert_query, (employee_id, current_date, current_time_only, status, late_minutes))
        
        # Broadcast attendance change to admin
        broadcast_database_change('attendance', 'update', {
            'employee_id': employee_id,
            'date': current_date.isoformat(),
            'action': 'clock_in',
            'clock_in_time': current_time_only.strftime('%H:%M'),
            'status': status,
            'late_minutes': late_minutes
        })
        
        return jsonify({
            'success': True, 
            'message': f'Clocked in successfully at {current_time_only.strftime("%H:%M")}',
            'status': status,
            'late_minutes': late_minutes,
            'clock_in_time': current_time_only.strftime('%H:%M')
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
        
        user_query = "SELECT id FROM users WHERE id = %s AND user_type = 'employee'"
        user = execute_query(user_query, (employee_id,), fetch_one=True)
        
        if not user:
            return jsonify({'error': 'Employee not found'}), 404
        
        from datetime import datetime, time, date
        
        current_time = datetime.now()
        current_date = current_time.date()
        current_time_only = current_time.time()
        
        check_query = "SELECT id, clock_in_time, clock_out_time, status FROM attendance WHERE employee_id = %s AND date = %s"
        attendance = execute_query(check_query, (employee_id, current_date), fetch_one=True)
        
        if not attendance or not attendance['clock_in_time']:
            return jsonify({'error': 'Please clock in first'}), 400
        
        if attendance['clock_out_time']:
            return jsonify({'error': 'Already clocked out today'}), 400
        
        clock_in_time = attendance['clock_in_time']
        
        # Handle different time formats
        if hasattr(clock_in_time, 'total_seconds'):  # timedelta object
            clock_in_hours = int(clock_in_time.total_seconds() // 3600)
            clock_in_minutes = int((clock_in_time.total_seconds() % 3600) // 60)
        else:  # time object
            clock_in_hours = clock_in_time.hour
            clock_in_minutes = clock_in_time.minute
        
        total_minutes = (current_time_only.hour - clock_in_hours) * 60 + (current_time_only.minute - clock_in_minutes)
        total_hours = round(total_minutes / 60, 2)
        
        # Ensure reasonable hours (not more than 24 hours in a day)
        total_hours = max(0, min(total_hours, 24))
        
        update_query = """
        UPDATE attendance 
        SET clock_out_time = %s, total_hours = %s, updated_at = NOW()
        WHERE id = %s
        """
        execute_query(update_query, (current_time_only, total_hours, attendance['id']))
        
        # Broadcast attendance change to admin
        broadcast_database_change('attendance', 'update', {
            'employee_id': employee_id,
            'date': current_date.isoformat(),
            'action': 'clock_out',
            'clock_out_time': current_time_only.strftime('%H:%M'),
            'total_hours': total_hours
        })
        
        return jsonify({
            'success': True, 
            'message': f'Clocked out successfully at {current_time_only.strftime("%H:%M")}',
            'total_hours': total_hours,
            'clock_out_time': current_time_only.strftime('%H:%M')
        })
        
    except Exception as e:
        print(f"Clock out error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to clock out: {str(e)}'}), 500

@app.route('/api/employee/attendance/status', methods=['GET'])
def get_attendance_status():
    """Get today's attendance status for employee"""
    try:
        employee_id = request.args.get('employee_id')
        
        if not employee_id:
            return jsonify({'error': 'Employee ID is required'}), 400
        
        user_query = "SELECT id FROM users WHERE id = %s AND user_type = 'employee'"
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
        attendance = execute_query(query, (employee_id, current_date), fetch_one=True)
        
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
        
        # Handle time formatting for different data types
        def format_time(time_obj):
            if not time_obj:
                return None
            if hasattr(time_obj, 'total_seconds'):  # timedelta
                hours = int(time_obj.total_seconds() // 3600)
                minutes = int((time_obj.total_seconds() % 3600) // 60)
                return f"{hours:02d}:{minutes:02d}"
            elif hasattr(time_obj, 'strftime'):  # time/datetime
                return time_obj.strftime('%H:%M')
            else:
                return str(time_obj)
        
        return jsonify({
            'success': True,
            'attendance': {
                'clocked_in': attendance['clock_in_time'] is not None,
                'clocked_out': attendance['clock_out_time'] is not None,
                'status': attendance['status'],
                'clock_in_time': format_time(attendance['clock_in_time']),
                'clock_out_time': format_time(attendance['clock_out_time']),
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
        
        # Get date from query parameter, default to today
        selected_date = request.args.get('date')
        if selected_date:
            current_date = date.fromisoformat(selected_date)
        else:
            current_date = date.today()
        
        query = """
        SELECT a.*, u.name as employee_name, u.employee_id
        FROM attendance a
        JOIN users u ON a.employee_id = u.id
        WHERE a.date = %s AND u.user_type = 'employee'
        ORDER BY u.name
        """
        attendance_records = execute_query(query, (current_date,), fetch_all=True)
        
        # Helper function to format time objects (handles both time and timedelta)
        def format_time(time_obj):
            if not time_obj:
                return None
            if hasattr(time_obj, 'total_seconds'):  # timedelta
                hours = int(time_obj.total_seconds() // 3600)
                minutes = int((time_obj.total_seconds() % 3600) // 60)
                return f"{hours:02d}:{minutes:02d}"
            elif hasattr(time_obj, 'strftime'):  # time/datetime
                return time_obj.strftime('%H:%M')
            else:
                return str(time_obj)
        
        formatted_records = []
        for record in attendance_records:
            formatted_records.append({
                'id': record['id'],
                'employee_id': record['employee_id'],
                'employee_name': record['employee_name'],
                'employee_code': record['employee_id'],
                'date': record['date'].strftime('%Y-%m-%d'),
                'clock_in_time': format_time(record['clock_in_time']),
                'clock_out_time': format_time(record['clock_out_time']),
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

@app.route('/api/admin/attendance/download', methods=['GET'])
def download_attendance_report():
    """Download attendance report as CSV"""
    try:
        from datetime import date
        import csv
        from io import StringIO
        
        # Get date from query parameter, default to today
        selected_date = request.args.get('date')
        if selected_date:
            current_date = date.fromisoformat(selected_date)
        else:
            current_date = date.today()
        
        query = """
        SELECT a.*, u.name as employee_name, u.employee_id
        FROM attendance a
        JOIN users u ON a.employee_id = u.id
        WHERE a.date = %s AND u.user_type = 'employee'
        ORDER BY u.name
        """
        attendance_records = execute_query(query, (current_date,), fetch_all=True)
        
        # Helper function to format time objects (handles both time and timedelta)
        def format_time(time_obj):
            if not time_obj:
                return None
            if hasattr(time_obj, 'total_seconds'):  # timedelta
                hours = int(time_obj.total_seconds() // 3600)
                minutes = int((time_obj.total_seconds() % 3600) // 60)
                return f"{hours:02d}:{minutes:02d}"
            elif hasattr(time_obj, 'strftime'):  # time/datetime
                return time_obj.strftime('%H:%M')
            else:
                return str(time_obj)
        
        # Create CSV content
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Employee Name', 'Employee Code', 'Date', 'Clock In', 
            'Clock Out', 'Status', 'Total Hours', 'Late Minutes'
        ])
        
        # Write data rows
        for record in attendance_records:
            writer.writerow([
                record['employee_name'],
                record['employee_id'],
                record['date'].strftime('%Y-%m-%d'),
                format_time(record['clock_in_time']) or 'N/A',
                format_time(record['clock_out_time']) or 'N/A',
                record['status'],
                float(record['total_hours']) if record['total_hours'] else 0,
                record['late_minutes'] or 0
            ])
        
        # Prepare response
        csv_content = output.getvalue()
        output.close()
        
        from flask import make_response
        
        response = make_response(csv_content)
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = f'attachment; filename=attendance_report_{current_date}.csv'
        
        return response
        
    except Exception as e:
        print(f"Download attendance error: {e}")
        return jsonify({'error': 'Failed to download attendance report'}), 500

@app.route('/api/admin/attendance/monthly', methods=['GET'])
def download_monthly_attendance_report():
    """Download monthly attendance report as CSV"""
    try:
        from datetime import date
        import csv
        from io import StringIO
        
        # Get year and month from query parameters
        year = int(request.args.get('year', date.today().year))
        month = int(request.args.get('month', date.today().month))
        
        # Get all days in the month
        from calendar import monthrange
        days_in_month = monthrange(year, month)[1]
        
        # Query to get all attendance records for the month
        query = """
        SELECT a.*, u.name as employee_name, u.employee_id
        FROM attendance a
        JOIN users u ON a.employee_id = u.id
        WHERE YEAR(a.date) = %s AND MONTH(a.date) = %s AND u.user_type = 'employee'
        ORDER BY u.name, a.date
        """
        attendance_records = execute_query(query, (year, month), fetch_all=True)
        
        # Helper function to format time objects (handles both time and timedelta)
        def format_time(time_obj):
            if not time_obj:
                return None
            if hasattr(time_obj, 'total_seconds'):  # timedelta
                hours = int(time_obj.total_seconds() // 3600)
                minutes = int((time_obj.total_seconds() % 3600) // 60)
                return f"{hours:02d}:{minutes:02d}"
            elif hasattr(time_obj, 'strftime'):  # time/datetime
                return time_obj.strftime('%H:%M')
            else:
                return str(time_obj)
        
        # Create CSV content
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header with additional columns for monthly report
        writer.writerow([
            'Employee Name', 'Employee Code', 'Date', 'Clock In', 
            'Clock Out', 'Status', 'Total Hours', 'Late Minutes', 'Week Day'
        ])
        
        # Write data rows
        for record in attendance_records:
            date_obj = record['date']
            week_day = date_obj.strftime('%A')  # Full weekday name
            writer.writerow([
                record['employee_name'],
                record['employee_id'],
                record['date'].strftime('%Y-%m-%d'),
                format_time(record['clock_in_time']) or 'N/A',
                format_time(record['clock_out_time']) or 'N/A',
                record['status'],
                float(record['total_hours']) if record['total_hours'] else 0,
                record['late_minutes'] or 0,
                week_day
            ])
        
        # Prepare response
        csv_content = output.getvalue()
        output.close()
        
        from flask import make_response
        
        month_name = date(year, month, 1).strftime('%B')
        response = make_response(csv_content)
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = f'attachment; filename=monthly_attendance_report_{month_name}_{year}.csv'
        
        return response
        
    except Exception as e:
        print(f"Download monthly attendance error: {e}")
        return jsonify({'error': 'Failed to download monthly attendance report'}), 500

# Vendor Registration API endpoints
@app.route('/api/vendor/register', methods=['POST'])
def register_vendor_detailed():
    """Register vendor for full portal access with comprehensive YellowStone form data"""
    try:
        data = request.get_json()
        
        print(f"Received registration data: {data}")
        
        # Extract comprehensive form data with fallbacks
        company_name = data.get('companyName', '')
        contact_person = data.get('contactPersonName', '')
        email = data.get('emailAddress', '')
        phone = data.get('phoneNumber', '') or data.get('phone', '')
        address = data.get('communicationAddress', '') or data.get('address', '')
        business_type = data.get('companyType', '') or data.get('businessType', '')
        services = data.get('servicesOffered', '') or data.get('services', '')
        experience = data.get('previousWorkExperience', '') or data.get('experience', '')
        certifications = data.get('certifications', '')
        vendor_references = data.get('majorCustomers', '') or data.get('references', '')
        
        print(f"Field mapping check:")
        print(f"  companyName: '{company_name}' (type: {type(company_name)})")
        print(f"  contactPersonName: '{contact_person}' (type: {type(contact_person)})")
        print(f"  emailAddress: '{email}' (type: {type(email)})")
        print(f"  phoneNumber: '{phone}' (type: {type(phone)})")
        print(f"  communicationAddress: '{address}' (type: {type(address)})")
        print(f"  companyType: '{business_type}' (type: {type(business_type)})")
        print(f"  servicesOffered: '{services}' (type: {type(services)})")
        print(f"  previousWorkExperience: '{experience}' (type: {type(experience)})")
        
        # Additional comprehensive fields
        designation = data.get('designation', '')
        registered_address = data.get('registeredOfficeAddress', '')
        fax_number = data.get('faxNumber', '')
        website = data.get('website', '')
        nature_of_business = data.get('natureOfBusiness', '')
        year_of_establishment = data.get('yearOfEstablishment', '')
        pan_number = data.get('panNumber', '')
        bank_name = data.get('bankName', '')
        account_number = data.get('accountNumber', '')
        ifsc_code = data.get('ifscCode', '')
        branch_name = data.get('branchName', '')
        annual_turnover = data.get('annualTurnover', '')
        net_worth = data.get('netWorth', '')
        total_employees = data.get('totalEmployees', '')
        technical_staff = data.get('technicalStaff', '')
        technical_capabilities = data.get('technicalCapabilities', '')
        additional_info = data.get('additionalInformation', '')
        organization_structure = data.get('organizationStructure', '')
        supplier_bank_name = data.get('supplierBankName', '')
        supplier_account_number = data.get('supplierAccountNumber', '')
        supplier_ifsc_code = data.get('supplierIfscCode', '')
        supplier_branch_name = data.get('supplierBranchName', '')
        
        print(f"Extracted fields - Company: {company_name}, Contact: {contact_person}, Email: {email}")
        
        # Check required fields (handle empty strings)
        required_fields = [company_name, contact_person, email, phone, address]
        required_field_names = ['company_name', 'contact_person', 'email', 'phone', 'address']
        
        missing_fields = []
        for field_name, field_value in zip(required_field_names, required_fields):
            if not field_value or (isinstance(field_value, str) and field_value.strip() == '') or field_value is None:
                missing_fields.append(field_name)
        
        if missing_fields:
            print(f"Missing required fields: {missing_fields}")
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        
        # Test database connection first
        test_connection = get_db_connection()
        if not test_connection:
            print("❌ Database connection failed")
            return jsonify({'error': 'Database connection failed. Please try again later.'}), 500
        
        # Check if vendor already exists, create if not
        check_query = "SELECT id FROM vendors WHERE email = %s"
        existing_vendor = execute_query(check_query, (email,), fetch_one=True)
        
        if existing_vendor:
            vendor_id = existing_vendor['id']
            print(f"Found existing vendor with ID: {vendor_id}")
        else:
            # Create new vendor record
            print(f"Creating new vendor record for {email}")
            vendor_insert_query = """
            INSERT INTO vendors (company_name, contact_person, email, phone, address, 
                               business_type, registration_status, portal_access, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, 'pending', 0, NOW())
            """
            vendor_id = execute_query(vendor_insert_query, (
                company_name, contact_person, email, phone, address, business_type
            ))
            print(f"Created new vendor with ID: {vendor_id}")
        
        # Check if registration already exists by email
        check_reg_query = "SELECT id FROM vendor_registrations WHERE email = %s"
        existing_reg = execute_query(check_reg_query, (email,), fetch_one=True)
        
        if existing_reg:
            print(f"Registration already exists for email {email}")
            return jsonify({'error': 'Registration already submitted for this email'}), 400
        
        print(f"No existing registration found for email {email}, proceeding with new registration")
        
        # Store comprehensive form data using existing schema
        insert_query = """
        INSERT INTO vendor_registrations 
        (company_name, contact_person, email, phone, address, business_type, 
         services, experience, certifications, vendor_references, status, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending', NOW())
        """
        
        print(f"Executing insert query for vendor: {company_name}")
        execute_query(insert_query, (
            company_name, contact_person, email, phone, address, business_type,
            services, experience, certifications, vendor_references
        ))
        
        print(f"Successfully inserted vendor registration for {company_name}")
        
        # Broadcast the new registration to connected clients
        broadcast_database_change('vendor_registrations', 'insert', {
            'company_name': company_name,
            'contact_person': contact_person,
            'email': email,
            'status': 'pending'
        })
        
        return jsonify({
            'success': True,
            'message': 'Comprehensive vendor registration submitted successfully. You will receive an email once approved.'
        })
        
    except Exception as e:
        print(f"Vendor registration error: {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to submit vendor registration: {str(e)}'}), 500

# Test endpoint to check database connection
@app.route('/api/test-db', methods=['GET'])
def test_database():
    """Test database connection"""
    try:
        connection = get_db_connection()
        if connection:
            cursor = connection.cursor()
            cursor.execute("SELECT 1 as test")
            result = cursor.fetchone()
            cursor.close()
            connection.close()
            return jsonify({'success': True, 'message': 'Database connection successful', 'test': result})
        else:
            return jsonify({'success': False, 'message': 'No database connection'}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500

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
        
        print(f"=== APPROVE DEBUG ===")
        print(f"Registration ID: {registration_id}")
        print(f"Registration found: {registration is not None}")
        if registration:
            print(f"Current status: '{registration['status']}' (type: {type(registration['status'])})")
            print(f"Status comparison: '{registration['status']}' != 'pending' = {registration['status'] != 'pending'}")
        
        if not registration:
            return jsonify({'success': False, 'message': 'Registration not found'}), 404
        
        if registration['status'] not in ['pending', None]:
            print(f"Registration status is not pending: '{registration['status']}'")
            return jsonify({'success': False, 'message': f'Registration is not pending (current status: {registration["status"]})'}), 400
        
        # Update registration status
        update_query = "UPDATE vendor_registrations SET status = 'approved', updated_at = NOW() WHERE id = %s"
        execute_query(update_query, (registration_id,))
        
        # Find vendor by email and update status
        vendor_query = "SELECT id FROM vendors WHERE email = %s"
        vendor = execute_query(vendor_query, (registration['email'],), fetch_one=True)
        
        if vendor:
            # Update vendor status to approved
            vendor_update_query = "UPDATE vendors SET registration_status = 'approved', portal_access = 1 WHERE id = %s"
            execute_query(vendor_update_query, (vendor['id'],))
            
            # Generate password for vendor login
            vendor_password = generate_vendor_password()
            password_hash = bcrypt.hashpw(vendor_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Create vendor login
            login_query = """
            INSERT INTO vendor_logins (vendor_id, email, password_hash, company_name, contact_person, phone, address)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE password_hash = %s, company_name = %s, contact_person = %s, phone = %s, address = %s
            """
            execute_query(login_query, (
                vendor['id'],
                registration['email'],
                password_hash,
                registration['company_name'],
                registration['contact_person'],
                registration['phone'],
                registration['address'],
                password_hash,
                registration['company_name'],
                registration['contact_person'],
                registration['phone'],
                registration['address']
            ))
        else:
            # Create new vendor if not found
            vendor_insert_query = """
                INSERT INTO vendors (company_name, contact_person, email, phone, address, 
                                   business_type, registration_status, portal_access, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, 'approved', 1, NOW())
                """
            vendor_id = execute_query(vendor_insert_query, (
                registration['company_name'], registration['contact_person'], registration['email'],
                registration['phone'], registration['address'], registration['business_type']
            ))
            
            # Generate password for vendor login
            vendor_password = generate_vendor_password()
            password_hash = bcrypt.hashpw(vendor_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Create vendor login
            login_query = """
            INSERT INTO vendor_logins (vendor_id, email, password_hash, company_name, contact_person, phone, address)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            execute_query(login_query, (
                vendor_id, 
                registration['email'], 
                password_hash,
                registration['company_name'],
                registration['contact_person'],
                registration['phone'],
                registration['address']
            ))
        
        # Send credentials email to vendor
        email_sent = send_vendor_credentials_email(
            registration['email'], 
            vendor_password, 
            registration['company_name']
        )
        
        # Broadcast the database change to connected clients
        broadcast_database_change('vendor_registrations', 'update', {
            'id': registration_id,
            'status': 'approved',
            'company_name': registration['company_name']
        })
        
        email_status = "Credentials sent via email" if email_sent else "Warning: Email failed to send"
        
        return jsonify({
            'success': True,
            'message': f'Vendor registration approved successfully. {email_status}',
            'vendor_password': vendor_password,
            'email_sent': email_sent
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
        
        print(f"=== DECLINE DEBUG ===")
        print(f"Registration ID: {registration_id}")
        print(f"Registration found: {registration is not None}")
        if registration:
            print(f"Current status: '{registration['status']}' (type: {type(registration['status'])})")
            print(f"Status comparison: '{registration['status']}' != 'pending' = {registration['status'] != 'pending'}")
        
        if not registration:
            return jsonify({'success': False, 'message': 'Registration not found'}), 404
        
        if registration['status'] not in ['pending', None]:
            print(f"Registration status is not pending: '{registration['status']}'")
            return jsonify({'success': False, 'message': f'Registration is not pending (current status: {registration["status"]})'}), 400
        
        update_query = "UPDATE vendor_registrations SET status = 'rejected', updated_at = NOW() WHERE id = %s"
        execute_query(update_query, (registration_id,))
        
        # Broadcast the database change to connected clients
        broadcast_database_change('vendor_registrations', 'update', {
            'id': registration_id,
            'status': 'rejected',
            'company_name': registration['company_name']
        })
        
        return jsonify({
            'success': True,
            'message': 'Vendor registration rejected'
        })
        
    except Exception as e:
        print(f"Decline vendor registration error: {e}")
        return jsonify({'error': 'Failed to decline vendor registration'}), 500

@app.route('/api/vendor/dashboard-stats', methods=['GET'])
def get_vendor_dashboard_stats():
    """Get vendor dashboard statistics"""
    try:
        vendor_id = request.headers.get('X-Vendor-ID')
        if not vendor_id:
            return jsonify({'success': False, 'message': 'Vendor ID required'}), 400
        
        # Get vendor basic info
        vendor_query = "SELECT company_name, nda_status, registration_status FROM vendors WHERE id = %s"
        vendor_data = execute_query(vendor_query, (vendor_id,), fetch_one=True)
        
        if not vendor_data:
            return jsonify({'success': False, 'message': 'Vendor not found'}), 404
        
        # Return real data - no sample figures
        stats = {
            'active_projects': 0,
            'completed_tasks': 0,
            'performance_score': 0,
            'messages': 0,
            'pending_approvals': 0,
            'upcoming_deadlines': 0,
            'total_earnings': 0,
            'monthly_earnings': 0
        }
        
        return jsonify({
            'success': True,
            'stats': stats,
            'vendor_info': {
                'company_name': vendor_data['company_name'],
                'nda_status': vendor_data['nda_status'],
                'registration_status': vendor_data['registration_status']
            }
        })
        
    except Exception as e:
        print(f"Get vendor dashboard stats error: {e}")
        return jsonify({'success': False, 'message': 'Failed to get dashboard stats'}), 500

@app.route('/api/vendor/projects', methods=['GET'])
def get_vendor_projects():
    """Get vendor projects"""
    try:
        vendor_id = request.headers.get('X-Vendor-ID')
        if not vendor_id:
            return jsonify({'success': False, 'message': 'Vendor ID required'}), 400
        
        # Return empty projects list - no sample data
        projects = []
        
        return jsonify({
            'success': True,
            'projects': projects
        })
        
    except Exception as e:
        print(f"Get vendor projects error: {e}")
        return jsonify({'success': False, 'message': 'Failed to get projects'}), 500

@app.route('/api/vendor/tasks', methods=['GET'])
def get_vendor_tasks():
    """Get vendor tasks"""
    try:
        vendor_id = request.headers.get('X-Vendor-ID')
        if not vendor_id:
            return jsonify({'success': False, 'message': 'Vendor ID required'}), 400
        
        # Return empty tasks list - no sample data
        tasks = []
        
        return jsonify({
            'success': True,
            'tasks': tasks
        })
        
    except Exception as e:
        print(f"Get vendor tasks error: {e}")
        return jsonify({'success': False, 'message': 'Failed to get tasks'}), 500

@app.route('/api/vendor/notifications', methods=['GET'])
def get_vendor_notifications():
    """Get vendor notifications"""
    try:
        vendor_id = request.headers.get('X-Vendor-ID')
        if not vendor_id:
            return jsonify({'success': False, 'message': 'Vendor ID required'}), 400
        
        # Return empty notifications list - no sample data
        notifications = []
        
        return jsonify({
            'success': True,
            'notifications': notifications
        })
        
    except Exception as e:
        print(f"Get vendor notifications error: {e}")
        return jsonify({'success': False, 'message': 'Failed to get notifications'}), 500

@app.route('/api/vendor/profile', methods=['GET'])
def get_vendor_profile():
    """Get vendor profile data for display"""
    try:
        # Get vendor ID from session or request headers
        vendor_id = request.headers.get('X-Vendor-ID')
        print(f"Received vendor ID: {vendor_id}")
        
        if not vendor_id:
            return jsonify({'success': False, 'message': 'Vendor ID required'}), 400
        
        # Get basic vendor information
        vendor_query = """
        SELECT id, company_name, contact_person, email, phone, address, 
               business_type, registration_number, country, state,
               registration_status, nda_status, reference_number,
               portal_access, has_full_access, created_at, updated_at,
               signature_data, company_stamp_data, signature_type, signed_date,
               company_registration_number, company_incorporation_country, company_incorporation_state
        FROM vendors WHERE id = %s
        """
        vendor_data = execute_query(vendor_query, (vendor_id,), fetch_one=True)
        print(f"Vendor data found: {vendor_data is not None}")
        
        if not vendor_data:
            return jsonify({'success': False, 'message': 'Vendor not found'}), 404
        
        # Get comprehensive registration data if available (using correct columns)
        registration_query = """
        SELECT company_name, contact_person, email, phone, address, business_type,
               services, experience, certifications, vendor_references, status,
               created_at, updated_at
        FROM vendor_registrations WHERE email = %s
        ORDER BY created_at DESC LIMIT 1
        """
        registration_data = execute_query(registration_query, (vendor_data['email'],), fetch_one=True)
        
        # Get NDA form data if available
        nda_query = """
        SELECT form_data, status, signed_at, created_at
        FROM nda_forms WHERE vendor_id = %s
        ORDER BY created_at DESC LIMIT 1
        """
        nda_data = execute_query(nda_query, (vendor_id,), fetch_one=True)
        
        # Parse NDA form data if available
        nda_form_data = {}
        if nda_data and nda_data['form_data']:
            try:
                nda_form_data = json.loads(nda_data['form_data'])
            except json.JSONDecodeError:
                nda_form_data = {}
        
        # Create comprehensive data from vendor table and registration data
        comprehensive_data = {
            'companyName': vendor_data['company_name'],
            'contactPersonName': vendor_data['contact_person'],
            'emailAddress': vendor_data['email'],
            'phoneNumber': vendor_data['phone'],
            'communicationAddress': vendor_data['address'],
            'businessType': vendor_data['business_type'] or 'Technology Services',
            'registrationNumber': vendor_data['registration_number'] or vendor_data['company_registration_number'],
            'country': vendor_data['country'] or vendor_data['company_incorporation_country'],
            'state': vendor_data['state'] or vendor_data['company_incorporation_state']
        }
        
        # Add registration data if available
        if registration_data:
            comprehensive_data.update({
                'servicesOffered': registration_data['services'],
                'experience': registration_data['experience'],
                'certifications': registration_data['certifications'],
                'vendorReferences': registration_data['vendor_references']
            })
        
        # Combine vendor data with comprehensive registration data
        profile_data = {
            'id': vendor_data['id'],
            'company_name': vendor_data['company_name'],
            'contact_person': vendor_data['contact_person'],
            'email': vendor_data['email'],
            'phone': vendor_data['phone'],
            'address': vendor_data['address'],
            'business_type': vendor_data['business_type'],
            'registration_number': vendor_data['registration_number'],
            'country': vendor_data['country'],
            'state': vendor_data['state'],
            'registration_status': vendor_data['registration_status'],
            'nda_status': vendor_data['nda_status'],
            'reference_number': vendor_data['reference_number'],
            'portal_access': vendor_data['portal_access'],
            'has_full_access': vendor_data['has_full_access'],
            'created_at': vendor_data['created_at'].isoformat() if vendor_data['created_at'] else None,
            'updated_at': vendor_data['updated_at'].isoformat() if vendor_data['updated_at'] else None,
            'comprehensive_data': comprehensive_data,
            'registration_status_detail': registration_data['status'] if registration_data else None,
            'submitted_at': registration_data['created_at'].isoformat() if registration_data and registration_data['created_at'] else None,
            'reviewed_at': registration_data['updated_at'].isoformat() if registration_data and registration_data['updated_at'] else None,
            'nda_form_data': nda_form_data,
            'nda_signed_at': nda_data['signed_at'].isoformat() if nda_data and nda_data['signed_at'] else None,
            'signature_data': vendor_data['signature_data'],
            'company_stamp_data': vendor_data['company_stamp_data'],
            'signature_type': vendor_data['signature_type'],
            'signed_date': vendor_data['signed_date'].isoformat() if vendor_data['signed_date'] else None
        }
        
        return jsonify({
            'success': True,
            'profile': profile_data
        })
        
    except Exception as e:
        print(f"Get vendor profile error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': 'Failed to get vendor profile'}), 500
        
        # Get comprehensive registration data if available
        registration_query = """
        SELECT form_data, status, submitted_at, reviewed_at
        FROM vendor_registrations WHERE vendor_id = %s
        ORDER BY created_at DESC LIMIT 1
        """
        registration_data = execute_query(registration_query, (vendor_id,), fetch_one=True)
        
        # Get NDA form data if available
        nda_query = """
        SELECT form_data, status, signed_at, created_at
        FROM nda_forms WHERE vendor_id = %s
        ORDER BY created_at DESC LIMIT 1
        """
        nda_data = execute_query(nda_query, (vendor_id,), fetch_one=True)
        
        # Parse JSON form data if available
        comprehensive_data = {}
        if registration_data and registration_data['form_data']:
            try:
                comprehensive_data = json.loads(registration_data['form_data'])
            except json.JSONDecodeError:
                comprehensive_data = {}
        
        # Parse NDA form data if available
        nda_form_data = {}
        if nda_data and nda_data['form_data']:
            try:
                nda_form_data = json.loads(nda_data['form_data'])
            except json.JSONDecodeError:
                nda_form_data = {}
        
        # If no comprehensive registration data, use vendor table data
        if not comprehensive_data:
            comprehensive_data = {
                'companyName': vendor_data['company_name'],
                'contactPersonName': vendor_data['contact_person'],
                'emailAddress': vendor_data['email'],
                'phoneNumber': vendor_data['phone'],
                'communicationAddress': vendor_data['address'],
                'businessType': vendor_data['business_type'] or 'Technology Services',
                'registrationNumber': vendor_data['registration_number'] or vendor_data['company_registration_number'],
                'country': vendor_data['country'] or vendor_data['company_incorporation_country'],
                'state': vendor_data['state'] or vendor_data['company_incorporation_state']
            }
        
        # Combine vendor data with comprehensive registration data
        profile_data = {
            'id': vendor_data['id'],
            'company_name': vendor_data['company_name'],
            'contact_person': vendor_data['contact_person'],
            'email': vendor_data['email'],
            'phone': vendor_data['phone'],
            'address': vendor_data['address'],
            'business_type': vendor_data['business_type'],
            'registration_number': vendor_data['registration_number'],
            'country': vendor_data['country'],
            'state': vendor_data['state'],
            'registration_status': vendor_data['registration_status'],
            'nda_status': vendor_data['nda_status'],
            'reference_number': vendor_data['reference_number'],
            'portal_access': vendor_data['portal_access'],
            'has_full_access': vendor_data['has_full_access'],
            'created_at': vendor_data['created_at'].isoformat() if vendor_data['created_at'] else None,
            'updated_at': vendor_data['updated_at'].isoformat() if vendor_data['updated_at'] else None,
            'comprehensive_data': comprehensive_data,
            'registration_status_detail': registration_data['status'] if registration_data else None,
            'submitted_at': registration_data['submitted_at'].isoformat() if registration_data and registration_data['submitted_at'] else None,
            'reviewed_at': registration_data['reviewed_at'].isoformat() if registration_data and registration_data['reviewed_at'] else None,
            'nda_form_data': nda_form_data,
            'nda_signed_at': nda_data['signed_at'].isoformat() if nda_data and nda_data['signed_at'] else None,
            'signature_data': vendor_data['signature_data'],
            'company_stamp_data': vendor_data['company_stamp_data'],
            'signature_type': vendor_data['signature_type'],
            'signed_date': vendor_data['signed_date'].isoformat() if vendor_data['signed_date'] else None
        }
        
        return jsonify({
            'success': True,
            'profile': profile_data
        })
        
    except Exception as e:
        print(f"Get vendor profile error: {e}")
        return jsonify({'success': False, 'message': 'Failed to get vendor profile'}), 500

@app.route('/api/vendor/nda-form/download', methods=['GET'])
def download_vendor_nda_form():
    """Download vendor's completed NDA form as PDF"""
    try:
        vendor_id = request.headers.get('X-Vendor-ID')
        if not vendor_id:
            return jsonify({'success': False, 'message': 'Vendor ID required'}), 400
        
        # Get vendor and NDA form data
        vendor_query = """
        SELECT company_name, contact_person, email, phone, address, 
               business_type, reference_number, signature_data, 
               company_stamp_data, signature_type, signed_date
        FROM vendors WHERE id = %s
        """
        vendor_data = execute_query(vendor_query, (vendor_id,), fetch_one=True)
        
        if not vendor_data:
            return jsonify({'success': False, 'message': 'Vendor not found'}), 404
        
        # Get NDA form data
        nda_query = """
        SELECT form_data, signed_at FROM nda_forms WHERE vendor_id = %s
        ORDER BY created_at DESC LIMIT 1
        """
        nda_data = execute_query(nda_query, (vendor_id,), fetch_one=True)
        
        if not nda_data:
            return jsonify({'success': False, 'message': 'NDA form not found'}), 404
        
        # Parse NDA form data
        nda_form_data = {}
        if nda_data['form_data']:
            try:
                nda_form_data = json.loads(nda_data['form_data'])
            except json.JSONDecodeError:
                nda_form_data = {}
        
        # Create PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            alignment=1  # Center alignment
        )
        story.append(Paragraph("NON-DISCLOSURE AGREEMENT", title_style))
        story.append(Spacer(1, 20))
        
        # Company Information
        story.append(Paragraph("Company Information:", styles['Heading2']))
        story.append(Spacer(1, 12))
        
        company_info = [
            ['Company Name:', vendor_data['company_name'] or 'N/A'],
            ['Contact Person:', vendor_data['contact_person'] or 'N/A'],
            ['Email:', vendor_data['email'] or 'N/A'],
            ['Phone:', vendor_data['phone'] or 'N/A'],
            ['Address:', vendor_data['address'] or 'N/A'],
            ['Business Type:', vendor_data['business_type'] or 'N/A'],
            ['Reference Number:', vendor_data['reference_number'] or 'N/A'],
            ['Signed Date:', vendor_data['signed_date'].strftime('%Y-%m-%d') if vendor_data['signed_date'] else 'N/A']
        ]
        
        company_table = Table(company_info, colWidths=[2*inch, 4*inch])
        company_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(company_table)
        story.append(Spacer(1, 20))
        
        # NDA Terms (simplified version)
        story.append(Paragraph("Agreement Terms:", styles['Heading2']))
        story.append(Spacer(1, 12))
        
        terms = [
            "1. Confidential Information: The parties acknowledge that they may receive confidential and proprietary information.",
            "2. Non-Disclosure: Each party agrees not to disclose confidential information to third parties.",
            "3. Use Limitation: Confidential information shall only be used for the purpose of evaluating business opportunities.",
            "4. Return of Information: Upon request, all confidential information shall be returned or destroyed.",
            "5. Term: This agreement shall remain in effect for a period of 5 years from the date of signing.",
            "6. Governing Law: This agreement shall be governed by the laws of the jurisdiction where YellowStone Group operates."
        ]
        
        for term in terms:
            story.append(Paragraph(term, styles['Normal']))
            story.append(Spacer(1, 6))
        
        story.append(Spacer(1, 20))
        
        # Signature Section
        story.append(Paragraph("Signatures:", styles['Heading2']))
        story.append(Spacer(1, 12))
        
        signature_info = [
            ['Signature Type:', vendor_data['signature_type'] or 'Digital'],
            ['Signature Present:', 'Yes' if vendor_data['signature_data'] else 'No'],
            ['Company Stamp Present:', 'Yes' if vendor_data['company_stamp_data'] else 'No']
        ]
        
        signature_table = Table(signature_info, colWidths=[2*inch, 4*inch])
        signature_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(signature_table)
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        # Create response
        response = make_response(buffer.getvalue())
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename=NDA_Form_{vendor_data["company_name"]}_{vendor_data["reference_number"]}.pdf'
        
        return response
        
    except Exception as e:
        print(f"Download NDA form error: {e}")
        return jsonify({'success': False, 'message': 'Failed to download NDA form'}), 500

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
        connection = get_db_connection()
        if not connection:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500
        
        cursor = connection.cursor()
        cursor.execute("""
            SELECT id, name, description, template_type, category, priority, 
                   form_fields, status, created_at, created_by_name
            FROM form_templates 
            ORDER BY created_at DESC
        """)
        
        templates = []
        for row in cursor.fetchall():
            templates.append({
                'id': row[0],
                'name': row[1],
                'description': row[2],
                'template_type': row[3],
                'category': row[4],
                'priority': row[5],
                'form_fields': row[6],
                'status': row[7],
                'created_at': row[8].isoformat() if row[8] else None,
                'created_by_name': row[9]
            })
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'templates': templates
        })
    except Exception as e:
        print(f"Error fetching templates: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/admin/templates', methods=['POST'])
def create_template():
    """Create a new form template"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'template_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
        
        connection = get_db_connection()
        if not connection:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500
        
        cursor = connection.cursor()
        
        # Insert new template
        insert_query = """
            INSERT INTO form_templates 
            (name, description, template_type, category, priority, form_fields, status, created_at, created_by_name)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), %s)
        """
        
        cursor.execute(insert_query, (
            data.get('name'),
            data.get('description', ''),
            data.get('template_type'),
            data.get('category', 'general'),
            data.get('priority', 'medium'),
            json.dumps(data.get('form_fields', {})),
            data.get('status', 'draft'),
            data.get('created_by_name', 'Admin')
        ))
        
        template_id = cursor.lastrowid
        connection.commit()
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'message': 'Template created successfully',
            'template_id': template_id
        })
        
    except Exception as e:
        print(f"Error creating template: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/admin/templates/<int:template_id>', methods=['DELETE'])
def delete_template(template_id):
    """Delete a form template"""
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500
        
        cursor = connection.cursor()
        
        # Check if template exists
        cursor.execute("SELECT id FROM form_templates WHERE id = %s", (template_id,))
        if not cursor.fetchone():
            cursor.close()
            connection.close()
            return jsonify({'success': False, 'error': 'Template not found'}), 404
        
        # Delete template
        cursor.execute("DELETE FROM form_templates WHERE id = %s", (template_id,))
        connection.commit()
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'message': 'Template deleted successfully'
        })
        
    except Exception as e:
        print(f"Error deleting template: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

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

@app.route('/api/admin/broadcast-change', methods=['POST'])
def manual_broadcast_change():
    """Manually trigger a database change broadcast (for testing)"""
    try:
        data = request.get_json()
        
        table_name = data.get('table')
        action = data.get('action')
        change_data = data.get('data')
        
        if not all([table_name, action]):
            return jsonify({'success': False, 'error': 'Missing required fields: table, action'}), 400
        
        # Broadcast the change
        broadcast_database_change(table_name, action, change_data)
        
        return jsonify({
            'success': True,
            'message': f'Broadcasted {action} on {table_name}',
            'data': change_data
        })
        
    except Exception as e:
        print(f"Manual broadcast error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# WebSocket event handlers for real-time updates
@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print(f"Client connected: {request.sid}")
    emit('connected', {'message': 'Connected to real-time updates'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print(f"Client disconnected: {request.sid}")

@socketio.on('join_room')
def handle_join_room(data):
    """Handle client joining a specific room for targeted updates"""
    room = data.get('room', 'general')
    join_room(room)
    print(f"Client {request.sid} joined room: {room}")
    emit('joined_room', {'room': room})

@socketio.on('leave_room')
def handle_leave_room(data):
    """Handle client leaving a specific room"""
    room = data.get('room', 'general')
    leave_room(room)
    print(f"Client {request.sid} left room: {room}")
    emit('left_room', {'room': room})

def send_vendor_credentials_email(vendor_email, vendor_password, company_name):
    """Send vendor login credentials via email"""
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USERNAME
        msg['To'] = vendor_email
        msg['Subject'] = "Your Vendor Portal Access - YellowStone XPs"
        
        body = f"""
Dear Vendor,

Congratulations! Your registration for {company_name} has been approved.

You now have full access to the YellowStone XPs Vendor Portal.

Your login credentials:
Email: {vendor_email}
Password: {vendor_password}

Please log in at: http://localhost:3000/vendor-portal

Important Security Notes:
- Please change your password after first login
- Keep your credentials secure
- Contact support if you have any issues

Best regards,
YellowStone XPs Management Team
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(SMTP_USERNAME, vendor_email, text)
        server.quit()
        
        print(f"✅ Credentials email sent to {vendor_email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send credentials email: {e}")
        return False

def broadcast_database_change(table_name, action, data=None, room='admin'):
    """Broadcast database changes to connected clients"""
    try:
        message = {
            'table': table_name,
            'action': action,  # 'insert', 'update', 'delete'
            'data': data,
            'timestamp': datetime.now().isoformat()
        }
        
        # Broadcast to specific room (admin dashboard)
        socketio.emit('database_change', message, room=room)
        
        # Also broadcast to general room for any other listeners
        socketio.emit('database_change', message, room='general')
        
        print(f"Broadcasted database change: {table_name} - {action} - {data}")
        
    except Exception as e:
        print(f"Error broadcasting database change: {e}")

# Frontend API endpoints (without /admin prefix)
@app.route('/api/tasks', methods=['GET'])
def get_tasks_frontend():
    """Get all tasks for frontend"""
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500
        
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM tasks ORDER BY created_at DESC")
        tasks = cursor.fetchall()
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'tasks': tasks
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/projects', methods=['GET'])
def get_projects_frontend():
    """Get all projects for frontend"""
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500
        
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM projects ORDER BY created_at DESC")
        projects = cursor.fetchall()
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'projects': projects
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tickets', methods=['GET'])
def get_tickets_frontend():
    """Get all tickets for frontend"""
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500
        
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM tickets ORDER BY created_at DESC")
        tickets = cursor.fetchall()
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'tickets': tickets
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/project-updates', methods=['GET'])
def get_project_updates():
    """Get all project updates"""
    try:
        return jsonify([])
    except Exception as e:
        return jsonify({'error': 'Failed to get project updates'}), 500

@app.route('/api/admin/task-updates', methods=['GET'])
def get_task_updates():
    """Get all task updates"""
    try:
        return jsonify([])
    except Exception as e:
        return jsonify({'error': 'Failed to get task updates'}), 500

@app.route('/api/admin/ticket-updates', methods=['GET'])
def get_ticket_updates():
    """Get all ticket updates"""
    try:
        return jsonify([])
    except Exception as e:
        return jsonify({'error': 'Failed to get ticket updates'}), 500

# Employee-specific API endpoints
@app.route('/api/employee/notifications', methods=['GET'])
def get_employee_notifications():
    """Get notifications for a specific employee"""
    try:
        employee_id = request.args.get('employee_id')
        if not employee_id:
            return jsonify({'success': False, 'error': 'Employee ID required'}), 400
        
        # Return empty notifications for now
        return jsonify({
            'success': True,
            'notifications': []
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/employee/announcements', methods=['GET'])
def get_employee_announcements():
    """Get announcements for a specific employee"""
    try:
        employee_id = request.args.get('employee_id')
        if not employee_id:
            return jsonify({'success': False, 'error': 'Employee ID required'}), 400
        
        # Return empty announcements for now
        return jsonify({
            'success': True,
            'announcements': []
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500



@app.route('/api/debug/check-tickets-table', methods=['GET'])
def check_tickets_table():
    """Debug endpoint to check tickets table structure"""
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = connection.cursor()
        cursor.execute("DESCRIBE tickets")
        table_structure = cursor.fetchall()
        
        cursor.execute("SELECT * FROM tickets LIMIT 1")
        sample_data = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'table_structure': table_structure,
            'sample_data': sample_data
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/debug/employee-data', methods=['GET'])
def debug_employee_data():
    """Debug endpoint to check employee data"""
    try:
        employee_id = request.args.get('employee_id')
        if not employee_id:
            return jsonify({'error': 'Employee ID required'}), 400
        
        # Get all tickets
        tickets_query = "SELECT * FROM tickets"
        all_tickets = execute_query(tickets_query, fetch_all=True)
        
        # Get all projects  
        projects_query = "SELECT * FROM projects"
        all_projects = execute_query(projects_query, fetch_all=True)
        
        # Get all tasks
        tasks_query = "SELECT * FROM tasks"
        all_tasks = execute_query(tasks_query, fetch_all=True)
        
        return jsonify({
            'employee_id': employee_id,
            'all_tickets': all_tickets,
            'all_projects': all_projects,
            'all_tasks': all_tasks,
            'tickets_for_employee': [t for t in all_tickets if str(t.get('assigned_to_id')) == str(employee_id) or str(t.get('created_by')) == str(employee_id)],
            'projects_for_employee': [p for p in all_projects if str(p.get('assigned_to_id')) == str(employee_id)],
            'tasks_for_employee': [t for t in all_tasks if str(t.get('assigned_to_id')) == str(employee_id)]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/fix-employee-data', methods=['POST'])
def fix_employee_data():
    """Fix employee data by assigning existing data to the correct employee"""
    try:
        data = request.get_json()
        employee_id = data.get('employee_id')
        if not employee_id:
            return jsonify({'error': 'Employee ID required'}), 400
        
        # Update existing tickets to be assigned to this employee
        tickets_query = "UPDATE tickets SET assigned_to_id = %s WHERE assigned_to_id = 17"
        execute_query(tickets_query, (employee_id,))
        
        # Update existing projects to be assigned to this employee
        projects_query = "UPDATE projects SET assigned_to_id = %s WHERE assigned_to_id = 17"
        execute_query(projects_query, (employee_id,))
        
        # Update existing tasks to be assigned to this employee
        tasks_query = "UPDATE tasks SET assigned_to_id = %s WHERE assigned_to_id = 17"
        execute_query(tasks_query, (employee_id,))
        
        return jsonify({
            'success': True,
            'message': f'Updated all data to be assigned to employee {employee_id}'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/employee/create-ticket', methods=['POST'])
def create_employee_ticket():
    """Create a ticket for an employee"""
    try:
        data = request.get_json()
        employee_id = data.get('employee_id')
        title = data.get('title', 'Untitled Ticket')
        description = data.get('description', '')
        
        # Map frontend priority values to database values (based on actual database values)
        priority_mapping = {
            'urgent': 'Critical',
            'high': 'Critical', 
            'medium': 'Medium',
            'low': 'Low'
        }
        priority = priority_mapping.get(data.get('priority', '').lower(), 'Medium')
        
        # Map frontend category values to database values
        category_mapping = {
            'it support': 'technical',
            'technical': 'technical',
            'general': 'general',
            'bug': 'bug',
            'feature': 'feature'
        }
        category = category_mapping.get(data.get('category', '').lower(), 'general')
        
        if not employee_id:
            return jsonify({'success': False, 'error': 'Employee ID required'}), 400
        
        # Get employee details
        employee_query = "SELECT name, email FROM users WHERE id = %s"
        employee = execute_query(employee_query, (employee_id,), fetch_one=True)
        
        if not employee:
            return jsonify({'success': False, 'error': 'Employee not found'}), 404
        
        # Insert ticket into database
        connection = get_db_connection()
        if not connection:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500
        
        cursor = connection.cursor()
        ticket_query = """
        INSERT INTO tickets (title, description, priority, status, category, assigned_to, created_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        
        # Get employee name for created_by field
        employee_name = employee['name']
        
        cursor.execute(ticket_query, (
            title,
            description,
            priority,
            'open',
            category,
            category,  # assigned_to will temporarily contain the category
            employee_name  # created_by will contain the employee's name
        ))
        
        ticket_id = cursor.lastrowid
        connection.commit()
        cursor.close()
        connection.close()
        
        if ticket_id:
            print(f"✅ Ticket created successfully: ID {ticket_id} by employee {employee_id}")
            
            # Broadcast the change to admin dashboard
            broadcast_database_change('tickets', 'insert', {
                'id': ticket_id,
                'title': title,
                'priority': priority,
                'status': 'open',
                'assigned_to_name': employee['name'],
                'assigned_to_email': employee['email']
            })
            
            return jsonify({
                'success': True,
                'message': 'Ticket created successfully',
                'ticket_id': ticket_id
            })
        else:
            return jsonify({'success': False, 'error': 'Failed to create ticket'}), 500
            
    except Exception as e:
        print(f"❌ Error creating employee ticket: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/employee/projects/<int:project_id>/update', methods=['POST', 'PUT'])
def update_employee_project(project_id):
    """Update project status and comments for employee"""
    try:
        data = request.get_json()
        status = data.get('status')
        comments = data.get('comments', '')
        
        # Update project status and comments
        update_query = """
        UPDATE projects 
        SET status = %s, updated_at = NOW()
        WHERE id = %s
        """
        
        execute_query(update_query, (status, project_id))
        
        # Broadcast the change
        broadcast_database_change('projects', 'update', {
            'id': project_id,
            'status': status,
            'comments': comments
        })
        
        return jsonify({
            'success': True,
            'message': 'Project updated successfully'
        })
        
    except Exception as e:
        print(f"❌ Error updating employee project: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/employee/tasks/<int:task_id>/update', methods=['POST', 'PUT'])
def update_employee_task(task_id):
    """Update task status and comments for employee"""
    try:
        data = request.get_json()
        status = data.get('status')
        comments = data.get('comments', '')
        
        # Update task status and comments
        update_query = """
        UPDATE tasks 
        SET status = %s, updated_at = NOW()
        WHERE id = %s
        """
        
        execute_query(update_query, (status, task_id))
        
        # Broadcast the change
        broadcast_database_change('tasks', 'update', {
            'id': task_id,
            'status': status,
            'comments': comments
        })
        
        return jsonify({
            'success': True,
            'message': 'Task updated successfully'
        })
        
    except Exception as e:
        print(f"❌ Error updating employee task: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/employee/tickets/<int:ticket_id>/update', methods=['POST', 'PUT'])
def update_employee_ticket(ticket_id):
    """Update ticket status and comments for employee"""
    try:
        data = request.get_json()
        status = data.get('status')
        comments = data.get('comments', '')
        
        # Update ticket status and comments
        update_query = """
        UPDATE tickets 
        SET status = %s, updated_at = NOW()
        WHERE id = %s
        """
        
        execute_query(update_query, (status, ticket_id))
        
        # Broadcast the change
        broadcast_database_change('tickets', 'update', {
            'id': ticket_id,
            'status': status,
            'comments': comments
        })
        
        return jsonify({
            'success': True,
            'message': 'Ticket updated successfully'
        })
        
    except Exception as e:
        print(f"❌ Error updating employee ticket: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/employee/upload-profile-picture', methods=['POST'])
def upload_profile_picture():
    """Upload profile picture for the current user"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file and file.filename.lower().endswith(tuple(ALLOWED_IMAGE_EXTENSIONS)):
            # Generate unique filename
            filename = f"{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
            file_path = os.path.join(PROFILE_PHOTOS_FOLDER, filename)
            
            # Save the file
            file.save(file_path)
            
            # Update database with new profile picture path
            update_query = "UPDATE users SET profile_picture = %s WHERE id = %s"
            execute_query(update_query, (filename, user_id))
            
            return jsonify({
                'success': True,
                'message': 'Profile picture uploaded successfully',
                'filename': filename
            })
        else:
            return jsonify({'error': 'Invalid file type. Only PNG, JPG, JPEG, and GIF are allowed.'}), 400
            
    except Exception as e:
        print(f"❌ Upload profile picture error: {e}")
        return jsonify({'error': 'Failed to upload profile picture'}), 500

@app.route('/api/employee/remove-profile-picture', methods=['POST'])
def remove_profile_picture():
    """Remove profile picture for the current user"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        # Get current user's profile picture path
        query = "SELECT profile_picture FROM users WHERE id = %s"
        user = execute_query(query, (user_id,), fetch_one=True)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        profile_picture_path = user.get('profile_picture')
        
        # Remove profile picture from database
        update_query = "UPDATE users SET profile_picture = NULL WHERE id = %s"
        execute_query(update_query, (user_id,))
        
        # Delete the actual file if it exists
        if profile_picture_path:
            try:
                file_path = os.path.join(PROFILE_PHOTOS_FOLDER, profile_picture_path)
                if os.path.exists(file_path):
                    os.remove(file_path)
                    print(f"✅ Profile picture file deleted: {file_path}")
            except Exception as e:
                print(f"⚠️ Could not delete profile picture file: {e}")
        
        return jsonify({
            'success': True,
            'message': 'Profile picture removed successfully'
        })
        
    except Exception as e:
        print(f"❌ Remove profile picture error: {e}")
        return jsonify({'error': 'Failed to remove profile picture'}), 500

@app.route('/api/employee/profile-picture/<filename>')
def get_profile_picture(filename):
    """Serve profile picture files"""
    try:
        return send_from_directory(PROFILE_PHOTOS_FOLDER, filename)
    except Exception as e:
        print(f"❌ Error serving profile picture: {e}")
        return jsonify({'error': 'Profile picture not found'}), 404

if __name__ == '__main__':
    print("Starting Flask server with WebSocket support...")
    socketio.run(app, debug=False, host='0.0.0.0', port=8000)