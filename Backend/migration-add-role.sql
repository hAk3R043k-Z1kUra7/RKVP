-- Выполнить в SQL Editor Supabase, если таблица users уже создана без role

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- Назначить администратора (замените email на свой):
-- UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
