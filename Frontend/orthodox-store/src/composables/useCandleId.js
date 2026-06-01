import { computed } from 'vue';
import { useAuth } from './useAuth';

const GUEST_KEY = 'orthodox_visitor_id';

function createGuestId() {
  return crypto.randomUUID?.() || `v_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

/**
 * Уникальный идентификатор для свечи: у авторизованных — привязка к user.id,
 * у гостей — отдельный id в localStorage (не связан с аккаунтом).
 */
export function useCandleId() {
  const { user, isLoggedIn } = useAuth();

  const candleClientId = computed(() => {
    if (isLoggedIn.value && user.value?.id) {
      return `user:${user.value.id}`;
    }

    let guestId = localStorage.getItem(GUEST_KEY);
    if (!guestId) {
      guestId = createGuestId();
      localStorage.setItem(GUEST_KEY, guestId);
    }
    return `guest:${guestId}`;
  });

  return { candleClientId };
}
