/**
 * Запуск HTTPS-туннеля на локальный бэкенд (порт 3000).
 * На Windows при отсутствии cloudflared скачивает бинарник в Backend/.bin/
 */
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');

const PORT = process.env.TUNNEL_PORT || 3000;
const TARGET = `http://localhost:${PORT}`;
const BIN_DIR = path.join(__dirname, '..', '.bin');
const isWin = process.platform === 'win32';
const LOCAL_BIN = path.join(BIN_DIR, isWin ? 'cloudflared.exe' : 'cloudflared');

const DOWNLOAD_URL = isWin
  ? 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe'
  : process.platform === 'darwin'
    ? 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz'
    : 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64';

function findInPath() {
  try {
    if (isWin) {
      const lines = execSync('where cloudflared', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] })
        .trim()
        .split(/\r?\n/)
        .filter(Boolean);
      return lines[0] || null;
    }
    return execSync('command -v cloudflared', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

async function downloadWindowsBinary() {
  fs.mkdirSync(BIN_DIR, { recursive: true });
  console.log('cloudflared не найден. Скачиваем в', LOCAL_BIN);
  console.log('(один раз, ~20 МБ)\n');

  const res = await fetch(DOWNLOAD_URL, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`Не удалось скачать cloudflared: HTTP ${res.status}`);
  }

  const tmp = `${LOCAL_BIN}.download`;
  await pipeline(res.body, fs.createWriteStream(tmp));
  fs.renameSync(tmp, LOCAL_BIN);
  if (!isWin) fs.chmodSync(LOCAL_BIN, 0o755);

  console.log('Готово.\n');
  return LOCAL_BIN;
}

async function resolveBinary() {
  if (fs.existsSync(LOCAL_BIN)) return LOCAL_BIN;

  const fromPath = findInPath();
  if (fromPath) return fromPath;

  if (isWin) return downloadWindowsBinary();

  printHelp();
  process.exit(1);
}

function printHelp() {
  console.error(`
cloudflared не установлен.

Windows (рекомендуется — скрипт скачает сам при npm run tunnel):
  cd Backend && npm run tunnel

Или вручную:
  winget install --id Cloudflare.cloudflared -e

macOS / Linux:
  brew install cloudflared
  # или скачайте: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

Альтернатива (нужен бесплатный аккаунт ngrok):
  npm run tunnel:ngrok
`);
}

function runTunnel(binary) {
  console.log(`Туннель → ${TARGET}`);
  console.log('Скопируйте HTTPS-URL из вывода и добавьте /api для панели на GitHub Pages.\n');

  const child = spawn(binary, ['tunnel', '--url', TARGET], {
    stdio: 'inherit',
    shell: isWin && binary.includes(' '),
  });

  child.on('exit', (code) => process.exit(code ?? 0));
  child.on('error', (err) => {
    console.error(err.message);
    printHelp();
    process.exit(1);
  });
}

resolveBinary()
  .then(runTunnel)
  .catch((err) => {
    console.error(err.message || err);
    printHelp();
    process.exit(1);
  });
