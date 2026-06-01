const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function messageForStatus(status, data) {
  if (data?.error) return data.error;
  if (data?.errors?.length) return data.errors.join(', ');

  if (status === 400) return 'Некорректный запрос. Проверьте введённые данные.';
  if (status === 401) return 'Требуется авторизация. Войдите в аккаунт.';
  if (status === 403) return 'Недостаточно прав для этого действия.';
  if (status === 404) return 'Запрашиваемые данные не найдены.';
  if (status >= 500) return 'Ошибка на сервере. Попробуйте позже.';
  if (status >= 502) return 'Сервер временно недоступен. Попробуйте через несколько минут.';

  return `Ошибка запроса (${status})`;
}

async function parseResponse(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      res.ok
        ? 'Сервер вернул некорректный ответ.'
        : messageForStatus(res.status, null),
    );
  }
}

export async function apiFetch(path, options = {}) {
  let res;

  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...getHeaders(), ...options.headers },
    });
  } catch {
    throw new Error(
      'Нет соединения с сервером. Проверьте интернет или что бэкенд запущен.',
    );
  }

  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(messageForStatus(res.status, data));
  }

  return data;
}

export async function getProducts(params = {}) {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.category) qs.set('category', params.category);
  if (params.priceMin != null && params.priceMin !== '') qs.set('priceMin', params.priceMin);
  if (params.priceMax != null && params.priceMax !== '') qs.set('priceMax', params.priceMax);
  if (params.sortBy) qs.set('sortBy', params.sortBy);
  if (params.sortDir) qs.set('sortDir', params.sortDir);
  if (params.page) qs.set('page', params.page);
  if (params.limit) qs.set('limit', params.limit);
  const query = qs.toString();
  return apiFetch(`/products${query ? `?${query}` : ''}`);
}

export async function getProduct(id) {
  return apiFetch(`/products/${id}`);
}

export async function createProduct(body) {
  return apiFetch('/products', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateProduct(id, body) {
  return apiFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteProduct(id) {
  return apiFetch(`/products/${id}`, { method: 'DELETE' });
}

export async function updateProfile(body) {
  return apiFetch('/auth/me', { method: 'PATCH', body: JSON.stringify(body) });
}

export async function getCart() {
  return apiFetch('/cart');
}

export async function addCartItem(productId, quantity = 1) {
  return apiFetch('/cart/items', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  });
}

export async function updateCartItem(productId, quantity) {
  return apiFetch(`/cart/items/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  });
}

export async function removeCartItem(productId) {
  return apiFetch(`/cart/items/${productId}`, { method: 'DELETE' });
}

export async function clearCartApi() {
  return apiFetch('/cart', { method: 'DELETE' });
}

export async function getCandleStats(visitorId) {
  const qs = visitorId ? `?visitorId=${encodeURIComponent(visitorId)}` : '';
  return apiFetch(`/candles${qs}`);
}

export async function lightCandle(visitorId) {
  return apiFetch('/candles/light', {
    method: 'POST',
    body: JSON.stringify({ visitorId }),
  });
}

export async function getSaintNames(params = {}) {
  const qs = new URLSearchParams();
  if (params.month) qs.set('month', params.month);
  if (params.day) qs.set('day', params.day);
  if (params.gender) qs.set('gender', params.gender);
  const query = qs.toString();
  return apiFetch(`/names${query ? `?${query}` : ''}`);
}

export async function getFavoriteIds() {
  return apiFetch('/favorites/ids');
}

export async function getFavorites() {
  return apiFetch('/favorites');
}

export async function toggleFavorite(productId) {
  return apiFetch(`/favorites/${productId}`, { method: 'POST' });
}

export async function removeFavorite(productId) {
  return apiFetch(`/favorites/${productId}`, { method: 'DELETE' });
}

export async function getOrders() {
  return apiFetch('/orders');
}

export async function createOrder() {
  return apiFetch('/orders', { method: 'POST' });
}

export async function getRandomSaintName(params = {}) {
  const qs = new URLSearchParams();
  if (params.month) qs.set('month', params.month);
  if (params.day) qs.set('day', params.day);
  if (params.gender) qs.set('gender', params.gender);
  const query = qs.toString();
  return apiFetch(`/names/random${query ? `?${query}` : ''}`);
}
