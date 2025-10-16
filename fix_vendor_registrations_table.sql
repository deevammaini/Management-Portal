-- Fix vendor_registrations table to match the correct schema
-- This script adds the missing vendor_id column and updates the table structure

-- First, check if vendor_id column exists, if not add it
ALTER TABLE vendor_registrations 
ADD COLUMN IF NOT EXISTS vendor_id INT NOT NULL AFTER id;

-- Add foreign key constraint if it doesn't exist
ALTER TABLE vendor_registrations 
ADD CONSTRAINT fk_vendor_registrations_vendor_id 
FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;

-- Update the status enum to match the correct values
ALTER TABLE vendor_registrations 
MODIFY COLUMN status ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected') DEFAULT 'draft';

-- Add missing columns if they don't exist
ALTER TABLE vendor_registrations 
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP NULL AFTER status,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP NULL AFTER submitted_at,
ADD COLUMN IF NOT EXISTS reviewed_by INT NULL AFTER reviewed_at;

-- Add foreign key for reviewed_by if it doesn't exist
ALTER TABLE vendor_registrations 
ADD CONSTRAINT fk_vendor_registrations_reviewed_by 
FOREIGN KEY (reviewed_by) REFERENCES admins(id) ON DELETE SET NULL;

-- Update any existing records to have a vendor_id (use the first vendor if none exists)
UPDATE vendor_registrations 
SET vendor_id = (SELECT id FROM vendors LIMIT 1) 
WHERE vendor_id IS NULL OR vendor_id = 0;
