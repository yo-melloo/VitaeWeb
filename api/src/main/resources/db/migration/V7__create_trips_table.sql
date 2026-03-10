CREATE TABLE trips (
    id BIGSERIAL PRIMARY KEY,
    segment_id BIGINT NOT NULL REFERENCES segments(id),
    driver_id BIGINT REFERENCES drivers(id),
    vehicle_id BIGINT REFERENCES vehicles(id),
    departure_time TIMESTAMP NOT NULL,
    arrival_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'SCHEDULED',
    is_dobra BOOLEAN DEFAULT FALSE,
    is_passe BOOLEAN DEFAULT FALSE,
    is_impacted BOOLEAN DEFAULT FALSE,
    actual_arrival_time TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);
