-- Fix attendance table data types
-- Run this in Supabase SQL Editor

-- Drop and recreate attendance table with correct data types
DROP TABLE IF EXISTS attendance CASCADE;

CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER,
    date DATE,
    clock_in_time TIME,
    clock_out_time TIME,
    status VARCHAR(255),
    total_hours VARCHAR(255),
    late_minutes INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Insert the attendance data with correct data types
INSERT INTO attendance (id, employee_id, date, clock_in_time, clock_out_time, status, total_hours, late_minutes, created_at, updated_at) VALUES (1, 18, '2025-10-10', '13:13:19', NULL, 'Half Day', '0.00', 223, '2025-10-10 13:13:19', '2025-10-10 13:13:19');
INSERT INTO attendance (id, employee_id, date, clock_in_time, clock_out_time, status, total_hours, late_minutes, created_at, updated_at) VALUES (2, 17, '2025-10-10', '13:13:34', NULL, 'Half Day', '0.00', 223, '2025-10-10 13:13:33', '2025-10-10 13:13:33');
