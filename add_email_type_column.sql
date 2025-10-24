USE yellowstone_group;

-- Add email_type column to companies table
ALTER TABLE companies 
ADD COLUMN email_type ENUM('intro', 'first_followup', 'second_followup', 'third_followup', 'final_followup') DEFAULT 'intro';

-- Add email_type column to scheduled_emails table
ALTER TABLE scheduled_emails 
ADD COLUMN email_type ENUM('intro', 'first_followup', 'second_followup', 'third_followup', 'final_followup') DEFAULT 'intro';

-- Update existing companies to have 'intro' as default email type
UPDATE companies SET email_type = 'intro' WHERE email_type IS NULL;

-- Update existing scheduled emails to have 'intro' as default email type
UPDATE scheduled_emails SET email_type = 'intro' WHERE email_type IS NULL;

SELECT 'Email type columns added successfully!' AS Info;
SELECT id, company_name, email_type FROM companies LIMIT 5;
SELECT id, company_id, email_type FROM scheduled_emails LIMIT 5;
