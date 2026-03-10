-- Fix Enum Defaults and Existing Data

-- Drivers: Change default from AVAILABLE to DISPONIVEL
ALTER TABLE drivers ALTER COLUMN status SET DEFAULT 'DISPONIVEL';
UPDATE drivers SET status = 'DISPONIVEL' WHERE status = 'AVAILABLE';

-- Vehicles: Keep AVAILABLE but ensure it exists (it was already AVAILABLE in V4)
-- However, we ensure all existing vehicles are set to AVAILABLE if they were null or mismatched
ALTER TABLE vehicles ALTER COLUMN status SET DEFAULT 'AVAILABLE';
UPDATE vehicles SET status = 'AVAILABLE' WHERE status IS NULL OR status = 'OPERATIONAL';
