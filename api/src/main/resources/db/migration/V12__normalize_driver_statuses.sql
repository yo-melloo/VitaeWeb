-- Normalize Driver Statuses

UPDATE drivers SET status = 'DISPONIVEL' WHERE status = 'AVAILABLE';
UPDATE drivers SET status = 'ESCALADO' WHERE status = 'TRIP';
UPDATE drivers SET status = 'FOLGA' WHERE status IN ('OFF', 'RESTING');
UPDATE drivers SET status = 'ATESTADO' WHERE status = 'SICK';
UPDATE drivers SET status = 'AFASTADO' WHERE status = 'AWAY';
