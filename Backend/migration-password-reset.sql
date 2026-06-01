-- Сброс пароля: ключевое слово и токены по email
-- Выполните в SQL Editor Supabase

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS recovery_keyword_hash TEXT;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens (expires_at);

ALTER TABLE password_reset_tokens DISABLE ROW LEVEL SECURITY;
