-- Fix announcements table and handle existing data
-- Run this in Supabase SQL Editor

-- First, let's see what's in the current announcements table
-- SELECT * FROM announcements;

-- Drop the existing announcements table completely
DROP TABLE IF EXISTS announcements CASCADE;

-- Recreate announcements table with correct structure
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    message VARCHAR(255),
    priority VARCHAR(255),
    target_audience VARCHAR(255),
    created_by INTEGER,
    created_at TIMESTAMP,
    expires_at TEXT
);

-- Insert the announcements data
INSERT INTO announcements (id, title, message, priority, target_audience, created_by, created_at, expires_at) VALUES (1, 'Welcome to YellowStone XPs!', 'We are excited to have you on board. Please complete your profile and explore the employee portal.', 'high', 'employees', 1, '2025-10-10 11:46:33', NULL);
INSERT INTO announcements (id, title, message, priority, target_audience, created_by, created_at, expires_at) VALUES (2, 'Company Policy Update', 'Please review the updated company policies in the employee handbook. All employees must acknowledge receipt.', 'medium', 'employees', 1, '2025-10-10 11:46:33', NULL);
INSERT INTO announcements (id, title, message, priority, target_audience, created_by, created_at, expires_at) VALUES (3, 'Holiday Schedule', 'The holiday schedule for 2025 has been published. Please check the upcoming holidays section for details.', 'low', 'all', 1, '2025-10-10 11:46:33', NULL);

-- Verify the data was inserted
-- SELECT * FROM announcements;
