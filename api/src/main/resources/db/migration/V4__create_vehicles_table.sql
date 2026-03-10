CREATE TABLE vehicles (
    id BIGSERIAL PRIMARY KEY,
    plate VARCHAR(20) NOT NULL UNIQUE,
    prefix VARCHAR(50),
    status VARCHAR(50) DEFAULT 'AVAILABLE',
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);
