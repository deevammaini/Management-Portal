-- Add profile_picture column to users table
-- Run this SQL command in your MySQL database

ALTER TABLE users ADD COLUMN profile_picture VARCHAR(255) NULL AFTER address;

-- Optional: Add an index for better performance
CREATE INDEX idx_users_profile_picture ON users(profile_picture);
