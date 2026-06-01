-- Запустить в SQL Editor в Supabase Dashboard

-- ─── Таблица пользователей ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Таблица товаров ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  category    TEXT NOT NULL,
  image_url   TEXT,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Отключаем RLS (бэкенд использует service_role key) ──────────────────────
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- ─── Тестовые данные (опционально) ───────────────────────────────────────────
INSERT INTO products (name, description, price, category) VALUES
  ('Икона Спасителя', 'Икона Иисуса Христа, печать на дереве, 15×20 см', 850.00, 'Иконы'),
  ('Икона Богородицы «Казанская»', 'Репродукция на доске, 20×25 см', 1200.00, 'Иконы'),
  ('Крестик нательный серебряный', 'Серебро 925 пробы, освящён', 2500.00, 'Украшения'),
  ('Лампадное масло', 'Масло для лампад, 0.5 л, Афонское', 350.00, 'Свечи и масла'),
  ('Свечи восковые (10 шт)', 'Натуральный пчелиный воск, высота 25 см', 180.00, 'Свечи и масла'),
  ('Чётки деревянные', 'Из можжевельника, 33 зерна', 450.00, 'Аксессуары');
