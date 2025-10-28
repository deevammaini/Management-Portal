-- SQL Queries to Reset Vendor Registrations Status

-- 1. Set ALL approved vendor registrations to pending
UPDATE vendor_registrations 
SET status = 'pending', updated_at = NOW() 
WHERE status = 'approved';

-- 2. Set a specific vendor registration to pending (replace with actual ID)
-- UPDATE vendor_registrations 
-- SET status = 'pending', updated_at = NOW() 
-- WHERE id = 1;

-- 3. Set specific vendor registrations by email to pending
-- UPDATE vendor_registrations 
-- SET status = 'pending', updated_at = NOW() 
-- WHERE email IN ('deevammaini@gmail.com', 'another@email.com');

-- 4. Also deactivate the vendor logins for those vendors
UPDATE vendor_logins vl
INNER JOIN vendor_registrations vr ON vr.email = vl.email
SET vl.is_active = 0
WHERE vr.status = 'pending';

-- 5. Revert vendor portal access
UPDATE vendors v
INNER JOIN vendor_registrations vr ON vr.email = v.email
SET v.registration_status = 'pending', v.portal_access = 0
WHERE vr.status = 'pending';

-- Verification queries:
-- Check updated registrations
-- SELECT id, company_name, email, status, updated_at FROM vendor_registrations;

-- Check vendor login status
-- SELECT vl.id, vl.vendor_id, vl.email, vl.is_active, v.company_name 
-- FROM vendor_logins vl 
-- LEFT JOIN vendors v ON vl.vendor_id = v.id;

-- Check vendor portal access
-- SELECT id, company_name, email, registration_status, portal_access 
-- FROM vendors;
