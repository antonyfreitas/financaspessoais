-- ============================================================
--  MIGRATION: Minhas Finanças — execute no Supabase SQL Editor
--  Acesse: supabase.com → seu projeto → SQL Editor → New query
-- ============================================================

-- 1. Adicionar campo recorrente na tabela transacoes
ALTER TABLE transacoes
  ADD COLUMN IF NOT EXISTS recorrente BOOLEAN DEFAULT FALSE;

-- 2. Adicionar campo user_id para múltiplos usuários (login Google)
--    Deixar NULL por agora; quando ativar o login, popular com update
ALTER TABLE transacoes
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. (Opcional mas recomendado) Index para performance
CREATE INDEX IF NOT EXISTS idx_transacoes_user_id ON transacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_data    ON transacoes(data DESC);

-- 4. Row Level Security — ativar ANTES de colocar o login em produção
--    Por enquanto deixe comentado; descomente quando o login estiver funcionando
-- ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "users_own_data" ON transacoes
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);

-- ============================================================
--  VERIFICAR: rode isso para confirmar que as colunas existem
-- ============================================================
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'transacoes'
ORDER BY ordinal_position;
