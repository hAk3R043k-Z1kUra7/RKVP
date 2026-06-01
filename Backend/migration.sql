-- Запустить в SQL Editor в Supabase Dashboard

-- ─── Таблица пользователей ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'seller', 'admin')),
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

-- ─── Корзина пользователя ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items (user_id);
ALTER TABLE cart_items DISABLE ROW LEVEL SECURITY;

-- ─── Избранное ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites (user_id);
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;

-- ─── Заказы ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total       NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processing', 'completed', 'cancelled')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price       NUMERIC(10, 2) NOT NULL,
  quantity    INT NOT NULL CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- ─── Тестовые данные (опционально) ───────────────────────────────────────────
INSERT INTO products (name, description, price, category) VALUES
  ('Икона Спасителя', 'Икона Иисуса Христа, печать на дереве, 15×20 см', 850.00, 'Иконы'),
  ('Икона Богородицы «Казанская»', 'Репродукция на доске, 20×25 см', 1200.00, 'Иконы'),
  ('Крестик нательный серебряный', 'Серебро 925 пробы, освящён', 2500.00, 'Украшения'),
  ('Лампадное масло', 'Масло для лампад, 0.5 л, Афонское', 350.00, 'Свечи и масла'),
  ('Свечи восковые (10 шт)', 'Натуральный пчелиный воск, высота 25 см', 180.00, 'Свечи и масла'),
  ('Чётки деревянные', 'Из можжевельника, 33 зерна', 450.00, 'Аксессуары');
