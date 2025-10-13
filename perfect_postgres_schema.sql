-- Perfect PostgreSQL Schema for YellowStone Management System
-- Generated from MySQL export analysis
-- Generated on: 2025-10-13T11:50:22.883270

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    password_hash VARCHAR(255),
    name VARCHAR(255),
    employee_id VARCHAR(255),
    designation VARCHAR(255),
    department VARCHAR(255),
    manager VARCHAR(255),
    user_type VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    phone VARCHAR(255),
    hire_date TIMESTAMP,
    salary VARCHAR(255),
    status VARCHAR(255),
    last_login TEXT,
    profile_picture TEXT,
    address VARCHAR(255),
    emergency_contact VARCHAR(255),
    skills TEXT
);

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    description VARCHAR(255),
    head_id TEXT,
    budget VARCHAR(255),
    location VARCHAR(255),
    established_date TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255),
    email VARCHAR(255),
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    role VARCHAR(255),
    is_active INTEGER,
    last_login VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by TEXT
);

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    company_name VARCHAR(255),
    contact_person VARCHAR(255),
    phone VARCHAR(255),
    address VARCHAR(255),
    nda_status VARCHAR(255),
    portal_access INTEGER,
    reference_number VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    company_registration_number VARCHAR(255),
    company_incorporation_country VARCHAR(255),
    company_incorporation_state VARCHAR(255),
    signature_type VARCHAR(255),
    signature_data TEXT,
    company_stamp_data VARCHAR(255),
    signed_date TIMESTAMP,
    registration_status VARCHAR(255)
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    description VARCHAR(255),
    status VARCHAR(255),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    budget VARCHAR(255),
    created_by INTEGER,
    project_manager INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    salary_code VARCHAR(255),
    assigned_to_type VARCHAR(255),
    priority VARCHAR(255),
    assigned_to_id INTEGER
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    description VARCHAR(255),
    status VARCHAR(255),
    assigned_to_type VARCHAR(255),
    assigned_to_id INTEGER,
    priority VARCHAR(255),
    assigned_to INTEGER,
    assigned_by TEXT,
    due_date TIMESTAMP,
    created_by INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    salary_code VARCHAR(255)
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    message VARCHAR(255),
    priority VARCHAR(255),
    target_audience VARCHAR(255),
    created_by INTEGER,
    created_at TIMESTAMP,
    expires_at TEXT
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER,
    date TIMESTAMP,
    clock_in_time TIMESTAMP,
    clock_out_time TEXT,
    status VARCHAR(255),
    total_hours VARCHAR(255),
    late_minutes INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Create forms table
CREATE TABLE IF NOT EXISTS forms (
    id SERIAL PRIMARY KEY,
    template_id INTEGER,
    template_type VARCHAR(255),
    template_name VARCHAR(255),
    filled_data VARCHAR(255),
    status VARCHAR(255),
    submitted_by INTEGER,
    assigned_to INTEGER,
    due_date TIMESTAMP,
    priority VARCHAR(255),
    notes VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    description VARCHAR(255),
    category VARCHAR(255),
    status VARCHAR(255),
    assigned_to_type VARCHAR(255),
    assigned_to_id INTEGER,
    priority VARCHAR(255),
    assigned_to INTEGER,
    created_by INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    salary_code VARCHAR(255)
);

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    description VARCHAR(255),
    template_type VARCHAR(255),
    category VARCHAR(255),
    priority VARCHAR(255),
    form_fields VARCHAR(255),
    status VARCHAR(255),
    created_by INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Create contract_templates table
CREATE TABLE IF NOT EXISTS contract_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    description VARCHAR(255),
    category VARCHAR(255),
    priority VARCHAR(255),
    status VARCHAR(255),
    service_description INTEGER,
    contract_duration INTEGER,
    payment_terms INTEGER,
    deliverables INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by INTEGER
);

-- Create employment_templates table
CREATE TABLE IF NOT EXISTS employment_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    description VARCHAR(255),
    category VARCHAR(255),
    priority VARCHAR(255),
    status VARCHAR(255),
    personal_information INTEGER,
    employment_details INTEGER,
    emergency_contact INTEGER,
    bank_details INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by INTEGER
);

-- Create nda_templates table
CREATE TABLE IF NOT EXISTS nda_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    description VARCHAR(255),
    category VARCHAR(255),
    priority VARCHAR(255),
    status VARCHAR(255),
    company_name INTEGER,
    contact_person INTEGER,
    email_address INTEGER,
    phone_number INTEGER,
    company_address INTEGER,
    confidentiality_period INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by INTEGER
);

-- Create user_notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    notification_type VARCHAR(255),
    notification_id VARCHAR(255),
    is_read INTEGER,
    read_at VARCHAR(255),
    created_at TIMESTAMP
);

-- Create vendor_logins table
CREATE TABLE IF NOT EXISTS vendor_logins (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER,
    email VARCHAR(255),
    password_hash VARCHAR(255),
    company_name VARCHAR(255),
    contact_person VARCHAR(255),
    phone VARCHAR(255),
    address VARCHAR(255),
    is_active INTEGER,
    last_login VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Create vendor_registrations table
CREATE TABLE IF NOT EXISTS vendor_registrations (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255),
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(255),
    address VARCHAR(255),
    business_type VARCHAR(255),
    services VARCHAR(255),
    experience VARCHAR(255),
    certifications VARCHAR(255),
    vendor_references VARCHAR(255),
    status VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
