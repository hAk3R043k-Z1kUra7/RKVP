# GitHub Pages + локальный бэкенд

Фронт размещён на **GitHub Pages** (`https://krivetochkin.github.io/RKVP/`).  
Бэкенд работает на вашем ПК (`http://localhost:3000`).

Браузер **не разрешает** сайту с `github.io` напрямую вызывать `http://localhost:3000` — запрос блокируется до сервера.

**Рабочая схема:** бэкенд остаётся локальным, но наружу отдаётся через **HTTPS-туннель** (Cloudflare). Фронт обращается уже к адресу туннеля.

## Шаг 1. Запустить бэкенд

```bash
cd Backend
npm install
npm run dev
```

Проверка: [http://localhost:3000/api/health](http://localhost:3000/api/health) → `{"ok":true,...}`

## Шаг 2. Туннель на порт 3000

В **новом** терминале (бэкенд должен уже работать):

```bash
cd Backend
npm run tunnel
```

На **Windows** при первом запуске скрипт **сам скачает** `cloudflared` в папку `Backend/.bin/` (интернет нужен, ~20 МБ). Устанавливать вручную не обязательно.

Если нужна установка в систему (PATH):

```powershell
cd Backend
npm run tunnel:install
```

После установки через winget **перезапустите терминал**.

Альтернатива — [ngrok](https://ngrok.com/) (нужен бесплатный аккаунт и `ngrok config add-authtoken …`):

```bash
npm run tunnel:ngrok
```

В выводе появится строка вида:

```text
https://random-words.trycloudflare.com
```

Скопируйте этот **HTTPS**-адрес. К нему добавьте `/api`, например:

```text
https://random-words.trycloudflare.com/api
```

> URL меняется при каждом новом запуске `cloudflared` (бесплатный quick tunnel).

## Шаг 4. Прописать URL в коде и задеплоить

Откройте файл `Frontend/orthodox-store/.env.production`:

```env
VITE_API_URL=https://ваш-поддомен.trycloudflare.com/api
```

Подставьте HTTPS-адрес из вывода `npm run tunnel` **с суффиксом `/api`**.

Закоммитьте, запушьте в `main` — workflow **Deploy to GitHub Pages** пересоберёт фронт с этим адресом.

> При каждом новом `npm run tunnel` (quick tunnel) URL **меняется** — обновите `.env.production` и снова запушьте.

В **GitHub → Settings → Actions → Variables** не должно быть `VITE_API_URL` с путём `/RKVP` или URL GitHub Pages — иначе перебьёт `.env.production`.

## Частые проблемы

| Симптом | Причина |
|---------|---------|
| `ERR_FAILED` на `localhost:3000` | Открыт GitHub Pages, туннель не настроен |
| 404 на `github.io/RKVP/products` | В `VITE_API_URL` ошибочно указан путь фронта |
| Туннель есть, но 502 | Бэкенд не запущен или cloudflared указывает не на 3000 |
| После перезапуска cloudflared не работает | Новый URL — обновите `.env.production` и задеплойте |

## Только локальная разработка (без Pages)

```bash
cd Backend && npm run dev
cd Frontend/orthodox-store && npm run dev
```

Открыть `http://localhost:5173/RKVP/` — туннель не нужен.
