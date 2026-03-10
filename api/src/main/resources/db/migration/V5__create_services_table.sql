CREATE TABLE services (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE TABLE service_operational_days (
    service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL,
    PRIMARY KEY (service_id, day_of_week)
);
