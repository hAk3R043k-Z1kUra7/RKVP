# Святое Торжище

Веб-приложение интернет-магазина церковной утвари: каталог товаров, корзина и заказы, личный кабинет, виртуальная свеча, генератор имён для крещения, панель продавца и администратора.

## Production

| Сервис | URL |
|--------|-----|
| Фронтенд | [GitHub Pages](https://krivetochkin.github.io/RKVP/) |
| Бэкенд API | локально (см. docs) или облако (Render, Railway…) |
| Репозиторий | _ссылка на GitHub/GitLab_ |

**GitHub Pages + бэкенд на своём ПК:** прямой `localhost` с Pages не работает — нужен HTTPS-туннель. Инструкция: [docs/pages-local-backend.md](docs/pages-local-backend.md).

Для полностью облачного деплоя задайте `VITE_API_URL` (Actions → Variables) на публичный URL API с суффиксом `/api`.

## Локальный запуск

### Требования

- Node.js 18+
- Проект Supabase (PostgreSQL) с выполненными миграциями из `Backend/migration.sql` и дополнительных файлов `migration-*.sql`

### 1. Бэкенд

```bash
cd Backend
cp .env.example .env
# Заполните SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, при необходимости ADMIN_EMAILS
npm install
npm run dev
```

Сервер по умолчанию: `http://localhost:3000`

Проверка: `GET http://localhost:3000/api/health`

### 2. Фронтенд

```bash
cd Frontend/orthodox-store
npm install
# Опционально: .env с VITE_API_URL=http://localhost:3000/api
npm run dev
```

Сайт по умолчанию: `http://localhost:5173`

## Переменные окружения

### Backend (`Backend/.env`)

| Переменная | Описание |
|------------|----------|
| `PORT` | Порт сервера (по умолчанию 3000) |
| `SUPABASE_URL` | URL проекта Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `JWT_SECRET` | Секрет для JWT (≥ 32 символа) |
| `ADMIN_EMAILS` | Email админов через запятую |
| `SELLER_EMAILS` | Email продавцов через запятую |
| `DATABASE_URL` | URI PostgreSQL (для `npm run migrate:cart`) |

### Frontend

| Переменная | Описание |
|------------|----------|
| `VITE_API_URL` | Базовый URL API, например `https://api.example.com/api` |

## Основные функции

- **Каталог** — поиск, фильтр по категории и цене, сортировка, пагинация («Загрузить ещё»), избранное
- **Корзина** — гостевая и серверная для авторизованных пользователей, оформление заказа
- **Личный кабинет** — профиль, заказы, избранное, выход из аккаунта
- **Аутентификация** — регистрация, вход, сброс пароля (email или ключевое слово), защита маршрутов
- **Виртуальная свеча** — счётчик посетителей за день
- **Генератор имён** — имена святых по дате и полу
- **Панель продавца/админа** — CRUD товаров, управление ролями (admin)

## API (основные эндпоинты)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/health` | Проверка БД |
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| POST | `/api/auth/forgot-password` | Запрос ссылки на email |
| POST | `/api/auth/reset-password` | Новый пароль (токен или ключевое слово) |
| GET | `/api/auth/me` | Текущий пользователь |
| PATCH | `/api/auth/me` | Обновление профиля |
| GET | `/api/products` | Каталог (`search`, `category`, `priceMin`, `priceMax`, `sortBy`, `page`) |
| GET/POST/PUT/DELETE | `/api/products/:id` | Товар (изменение — seller/admin) |
| GET/POST/PATCH/DELETE | `/api/cart` | Корзина (авторизация) |
| GET/POST | `/api/favorites` | Избранное |
| GET/POST | `/api/orders` | Заказы |
| GET/POST | `/api/candles` | Виртуальная свеча |
| GET | `/api/names` | Имена святых |
| GET/POST | `/api/admin/users` | Пользователи (admin) |

## Технологии

| Слой | Стек |
|------|------|
| Frontend | Vue 3, Vue Router, Vite |
| Backend | Node.js, Express |
| БД | PostgreSQL (Supabase) |
| Auth | JWT, bcrypt |
| Хостинг | _Vercel / Render / Supabase — по вашему выбору_ |

## Скриншоты

Добавьте в папку `docs/screenshots/`:

1. `01-home.png` — главная страница  
2. `02-catalog.png` — каталог товаров  
3. `03-cabinet.png` — личный кабинет  
4. `04-cart.png` — корзина (опционально)  
5. `05-auth.png` — вход или регистрация (опционально)  

## Структура репозитория

```
Backend/          — Express API, миграции SQL
Frontend/orthodox-store/  — Vue-приложение
docs/screenshots/ — скриншоты для отчёта (создайте при сдаче)
```
