-- Ensure vehicle status consistency
UPDATE vehicles SET status = 'AVAILABLE' WHERE status = 'OPERATIONAL';
-- Default for new vehicles remains AVAILABLE as per V11
