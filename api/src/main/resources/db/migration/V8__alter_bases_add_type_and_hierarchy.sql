ALTER TABLE bases
    ADD COLUMN IF NOT EXISTS base_type VARCHAR(30) NOT NULL DEFAULT 'PONTO_DE_APOIO',
    ADD COLUMN IF NOT EXISTS parent_base_id BIGINT REFERENCES bases(id);

-- Define as bases operacionais (OPERACIONAL = tem operadores e motoristas residentes)
-- Define pontos de apoio (PONTO_DE_APOIO = parada operacional sem gestão própria)
-- parent_base_id: base operacional que administra este ponto de apoio

-- Após rodar esta migration, execute o seed_schedules.sql
-- e depois o seed_base_hierarchy_update.sql para configurar a hierarquia.
