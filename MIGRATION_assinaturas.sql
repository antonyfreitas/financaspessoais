-- ============================================================
--  MIGRATION: Minhas Finanças Pessoais — tabela assinaturas
--  Execute no Supabase SQL Editor do seu projeto
-- ============================================================

CREATE TABLE IF NOT EXISTS assinaturas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            TEXT NOT NULL,
  valor           NUMERIC(10,2) NOT NULL,
  periodicidade   TEXT NOT NULL CHECK (periodicidade IN ('mensal','anual','semanal')),
  dia_cobranca    INT  CHECK (dia_cobranca BETWEEN 1 AND 31),
  categoria       TEXT,
  cor             TEXT,
  ativo           BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Index para queries por status
CREATE INDEX IF NOT EXISTS idx_assinaturas_ativo ON assinaturas(ativo);

-- ============================================================
--  VERIFICAR
-- ============================================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'assinaturas'
ORDER BY ordinal_position;
