-- Check vendor login data for the email
SELECT vl.id, vl.vendor_id, vl.email, vl.company_name, vl.is_active, v.id as vendor_table_id, v.company_name as vendor_table_company
FROM vendor_logins vl
LEFT JOIN vendors v ON vl.vendor_id = v.id
WHERE vl.email = 'deevammaini@gmail.com'
ORDER BY vl.created_at DESC;

-- Check all vendors with this email
SELECT id, company_name, email, registration_status FROM vendors WHERE email = 'deevammaini@gmail.com';

-- Check vendor_registrations
SELECT id, company_name, email, status FROM vendor_registrations WHERE email = 'deevammaini@gmail.com' ORDER BY id DESC;
