CREATE TABLE drivers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    matricula VARCHAR(4) NOT NULL UNIQUE,
    base_id BIGINT REFERENCES bases(id),
    saldo_dias INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'AVAILABLE',
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);
