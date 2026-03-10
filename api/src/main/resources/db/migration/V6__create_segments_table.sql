CREATE TABLE segments (
    id BIGSERIAL PRIMARY KEY,
    service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    estimated_duration_minutes INTEGER,
    sequence INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);
