-- Add email threading support to scheduled_emails table
-- This will allow follow-up emails to be threaded properly in email clients

-- Add message_id column to store unique Message-ID for each sent email
ALTER TABLE scheduled_emails ADD COLUMN message_id VARCHAR(255) NULL;

-- Add in_reply_to column to store the Message-ID of the previous email in the thread
ALTER TABLE scheduled_emails ADD COLUMN in_reply_to VARCHAR(255) NULL;

-- Add references column to store all Message-IDs in the email thread
ALTER TABLE scheduled_emails ADD COLUMN references_header TEXT NULL;

-- Create index on message_id for faster lookups
CREATE INDEX idx_scheduled_emails_message_id ON scheduled_emails(message_id);

-- Create index on company_id and email_type for finding previous emails
CREATE INDEX idx_scheduled_emails_company_email_type ON scheduled_emails(company_id, email_type);

-- Verify the changes
SELECT 'Email threading columns added successfully!' AS Info;
SELECT id, company_id, email_type, message_id, in_reply_to FROM scheduled_emails LIMIT 5;
