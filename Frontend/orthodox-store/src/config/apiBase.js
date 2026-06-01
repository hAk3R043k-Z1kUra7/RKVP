const DEFAULT_API = 'http://localhost:3000/api';

function normalizeApiBase(url) {
  const trimmed = url.trim().replace(/\/+$/, '');
  if (!trimmed) return DEFAULT_API;
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

/** Базовый URL API: .env.development / .env.production или fallback localhost */
export function getApiBase() {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) return normalizeApiBase(fromEnv);
  return DEFAULT_API;
}
