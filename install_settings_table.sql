-- Create settings table and insert current email credentials
CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_category VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert current email settings
INSERT INTO system_settings (setting_key, setting_value, setting_category, description) VALUES
('smtp_server', 'smtp.gmail.com', 'email', 'SMTP server address'),
('smtp_port', '587', 'email', 'SMTP port number'),
('smtp_username', 'deevam.maini0412@gmail.com', 'email', 'Email address for sending emails'),
('smtp_password', 'kukv vgal lsif cuhn', 'email', 'Email password or app password'),
('from_name', 'YellowStone XPs', 'email', 'Display name for sent emails'),
('reply_to', 'deevam.maini0412@gmail.com', 'email', 'Reply-to address for emails')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Verify the settings were inserted
SELECT 'Settings table created successfully with current email credentials!' AS Info;
SELECT setting_key, setting_value, setting_category FROM system_settings WHERE setting_category = 'email';

