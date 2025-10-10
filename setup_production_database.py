#!/usr/bin/env python3
"""
Production Database Setup Script for CPanel Deployment
Run this script once after setting up your CPanel database
"""

import mysql.connector
from mysql.connector import Error
import os

# Database configuration - Update these with your CPanel database details
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'yourdomain_vendor_mgmt'),
    'user': os.getenv('DB_USER', 'yourdomain_admin'),
    'password': os.getenv('DB_PASSWORD', 'your_password_here')
}

def create_connection():
    """Create database connection"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def create_tables():
    """Create all necessary tables"""
    connection = create_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        
        # Create admins table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                username VARCHAR(100) UNIQUE NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'admin',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create vendor_logins table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vendor_logins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                vendor_id INT NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
            )
        """)
        
        # Create users table (if not exists)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                user_type ENUM('employee', 'admin') DEFAULT 'employee',
                employee_id VARCHAR(50) UNIQUE,
                designation VARCHAR(100),
                department VARCHAR(100),
                manager INT,
                phone VARCHAR(20),
                address TEXT,
                hire_date DATE,
                salary DECIMAL(10,2),
                emergency_contact VARCHAR(255),
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (manager) REFERENCES users(id) ON DELETE SET NULL
            )
        """)
        
        # Create vendors table (if not exists)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vendors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                company_name VARCHAR(255) NOT NULL,
                contact_person VARCHAR(255),
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20),
                address TEXT,
                industry VARCHAR(100),
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """)
        
        # Create departments table (if not exists)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS departments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                description TEXT,
                manager_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
            )
        """)
        
        # Create tasks table (if not exists)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                status ENUM('Pending', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',
                assigned_to_type ENUM('employee', 'vendor') DEFAULT 'employee',
                assigned_to_id INT,
                priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
                assigned_to INT,
                assigned_by VARCHAR(100),
                due_date DATE,
                created_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        # Create projects table (if not exists)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                status ENUM('Planning', 'Active', 'On Hold', 'Completed', 'Cancelled') DEFAULT 'Planning',
                start_date DATE,
                end_date DATE,
                budget VARCHAR(100) DEFAULT '',
                created_by INT NOT NULL,
                project_manager INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (project_manager) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        # Create tickets table (if not exists)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tickets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                category ENUM('general', 'technical', 'billing', 'support', 'feature_request', 'bug_report') DEFAULT 'general',
                status ENUM('Open', 'In Progress', 'Resolved', 'Closed') DEFAULT 'Open',
                assigned_to_type ENUM('employee', 'vendor') DEFAULT 'employee',
                assigned_to_id INT,
                priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
                assigned_to INT,
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            )
        """)
        
        # Create vendor_nda_forms table (if not exists)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vendor_nda_forms (
                id INT AUTO_INCREMENT PRIMARY KEY,
                vendor_id INT NOT NULL,
                reference_number VARCHAR(50) UNIQUE NOT NULL,
                company_name VARCHAR(255) NOT NULL,
                contact_person VARCHAR(255),
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                address TEXT,
                industry VARCHAR(100),
                form_data JSON,
                status ENUM('submitted', 'under_review', 'approved', 'rejected') DEFAULT 'submitted',
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reviewed_at TIMESTAMP NULL,
                FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
            )
        """)
        
        # Create vendor_registrations table (if not exists)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vendor_registrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                company_name VARCHAR(255) NOT NULL,
                contact_person VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20) NOT NULL,
                address TEXT NOT NULL,
                business_type VARCHAR(100) NOT NULL,
                services TEXT NOT NULL,
                experience TEXT NOT NULL,
                certifications TEXT,
                vendor_references TEXT,
                status ENUM('pending', 'approved', 'declined') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """)
        
        connection.commit()
        print("✅ All tables created successfully!")
        return True
        
    except Error as e:
        print(f"Error creating tables: {e}")
        return False
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def create_default_admin():
    """Create a default admin user"""
    connection = create_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        
        # Check if admin already exists
        cursor.execute("SELECT id FROM admins WHERE email = 'admin@yourdomain.com'")
        if cursor.fetchone():
            print("✅ Default admin already exists")
            return True
        
        # Create default admin
        import bcrypt
        password = "admin123"  # Change this in production!
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        cursor.execute("""
            INSERT INTO admins (email, username, full_name, password_hash, role)
            VALUES (%s, %s, %s, %s, %s)
        """, ('admin@yourdomain.com', 'admin', 'System Administrator', password_hash, 'admin'))
        
        connection.commit()
        print("✅ Default admin created successfully!")
        print("   Email: admin@yourdomain.com")
        print("   Username: admin")
        print("   Password: admin123")
        print("   ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!")
        return True
        
    except Error as e:
        print(f"Error creating default admin: {e}")
        return False
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    print("Setting up production database...")
    print("=" * 50)
    
    # Update DB_CONFIG with your actual CPanel database details
    print("⚠️  IMPORTANT: Update DB_CONFIG in this script with your CPanel database details!")
    print("   - DB_HOST: localhost")
    print("   - DB_NAME: yourdomain_vendor_mgmt")
    print("   - DB_USER: yourdomain_admin")
    print("   - DB_PASSWORD: your_actual_password")
    print()
    
    if create_tables():
        create_default_admin()
        print("\n🎉 Database setup completed successfully!")
        print("You can now deploy your Flask application.")
    else:
        print("\n❌ Database setup failed. Please check your configuration.")
