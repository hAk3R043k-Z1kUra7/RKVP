import { ref, computed } from 'vue';
import { apiFetch } from '../api';
import { setCartUser } from './useCart';
import { useFavorites } from './useFavorites';

const token = ref(localStorage.getItem('token'));
const user = ref(null);

try {
  const stored = localStorage.getItem('user');
  if (stored) user.value = JSON.parse(stored);
} catch {
  localStorage.removeItem('user');
}

export function useAuth() {
  const isLoggedIn = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const isSeller = computed(() => user.value?.role === 'seller');
  const canManageProducts = computed(
    () => user.value?.role === 'seller' || user.value?.role === 'admin',
  );

  const { loadFavoriteIds, clearFavoritesCache } = useFavorites();

  async function setAuth({ token: newToken, user: newUser }) {
    token.value = newToken;
    user.value = newUser;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    clearFavoritesCache();
    await setCartUser(newUser.id);
    await loadFavoriteIds().catch(() => {});
  }

  /** Полная очистка сессии: токен, профиль, корзина на сервере, избранное в памяти. */
  async function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearFavoritesCache();
    await setCartUser(null);
  }

  async function refreshUser() {
    if (!token.value) return null;
    const res = await apiFetch('/auth/me');
    user.value = res.user;
    localStorage.setItem('user', JSON.stringify(res.user));
    return res.user;
  }

  return {
    token,
    user,
    isLoggedIn,
    isAdmin,
    isSeller,
    canManageProducts,
    setAuth,
    logout,
    refreshUser,
  };
}
