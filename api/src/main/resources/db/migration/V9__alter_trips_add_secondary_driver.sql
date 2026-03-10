ALTER TABLE trips
    ADD COLUMN IF NOT EXISTS secondary_driver_id BIGINT REFERENCES drivers(id);

-- A 8ª ESCALA (SLZ/GOI 19:00) opera com dois motoristas em dupla no mesmo veículo.
-- secondary_driver_id é nulo para todas as escalas normais.
-- Apenas trechos de longa distância (ex: Imperatriz → Goiânia ~24h) usam dupla.
