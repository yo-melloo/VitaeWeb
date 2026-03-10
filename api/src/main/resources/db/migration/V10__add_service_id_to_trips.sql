ALTER TABLE trips ADD COLUMN service_id BIGINT NOT NULL;

ALTER TABLE trips 
ADD CONSTRAINT fk_trips_service_id 
FOREIGN KEY (service_id) REFERENCES services(id);

CREATE INDEX idx_trips_service_id_departure_time 
ON trips(service_id, departure_time);
