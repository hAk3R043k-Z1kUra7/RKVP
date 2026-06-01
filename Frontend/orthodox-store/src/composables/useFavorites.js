import { ref } from 'vue';
import { getFavoriteIds, toggleFavorite as apiToggle } from '../api';

const favoriteIds = ref(new Set());
const favoritesLoading = ref(false);
let loadedForUser = null;

export function useFavorites() {
  function isFavorite(productId) {
    return favoriteIds.value.has(productId);
  }

  async function loadFavoriteIds() {
    const token = localStorage.getItem('token');
    if (!token) {
      favoriteIds.value = new Set();
      loadedForUser = null;
      return;
    }

    const userId = (() => {
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        return u?.id || 'auth';
      } catch {
        return 'auth';
      }
    })();

    if (loadedForUser === userId) {
      return;
    }

    favoritesLoading.value = true;
    try {
      const data = await getFavoriteIds();
      favoriteIds.value = new Set(data.productIds ?? []);
      loadedForUser = userId;
    } catch {
      favoriteIds.value = new Set();
    } finally {
      favoritesLoading.value = false;
    }
  }

  function clearFavoritesCache() {
    favoriteIds.value = new Set();
    loadedForUser = null;
  }

  async function toggleFavorite(productId) {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Войдите в аккаунт, чтобы добавить в избранное');
    }

    const data = await apiToggle(productId);
    const next = new Set(favoriteIds.value);
    if (data.added) {
      next.add(productId);
    } else {
      next.delete(productId);
    }
    favoriteIds.value = next;
    return data.added;
  }

  return {
    favoriteIds,
    favoritesLoading,
    isFavorite,
    loadFavoriteIds,
    clearFavoritesCache,
    toggleFavorite,
  };
}
