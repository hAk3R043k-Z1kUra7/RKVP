# Установка cloudflared в PATH через winget (Windows)
Write-Host "Установка Cloudflare cloudflared..." -ForegroundColor Cyan
winget install --id Cloudflare.cloudflared -e --accept-source-agreements --accept-package-agreements
if ($LASTEXITCODE -eq 0) {
  Write-Host "`nГотово. Перезапустите терминал и выполните: npm run tunnel" -ForegroundColor Green
} else {
  Write-Host "`nwinget не сработал. Используйте: npm run tunnel (скачает в Backend/.bin)" -ForegroundColor Yellow
}
