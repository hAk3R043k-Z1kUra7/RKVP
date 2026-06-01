import { ref, computed, watch } from 'vue';
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCartApi,
} from '../api';

const GUEST_STORAGE_KEY = 'orthodox_cart_guest';

function getInitialUserId() {
  try {
    const stored = localStorage.getItem('user');
    if (stored) {
      const user = JSON.parse(stored);
      return user?.id || null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function loadGuestCart() {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuestCart(cartItems) {
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(cartItems));
}

function applyCartResponse(data) {
  if (data?.items) {
    items.value = data.items;
  }
}

let currentUserId = getInitialUserId();
const items = ref([]);
const cartLoading = ref(false);

watch(
  items,
  () => {
    if (!currentUserId) {
      saveGuestCart(items.value);
    }
  },
  { deep: true },
);

async function fetchServerCart() {
  const data = await getCart();
  items.value = data.items ?? [];
  return items.value;
}

async function syncGuestCartToServer(guestItems) {
  for (const item of guestItems) {
    await addCartItem(item.id, item.quantity);
  }
  saveGuestCart([]);
}

export async function setCartUser(userId) {
  const nextUserId = userId || null;
  if (currentUserId === nextUserId) return;

  const guestItemsToMerge = nextUserId && !currentUserId ? [...items.value] : [];

  currentUserId = nextUserId;

  if (!nextUserId) {
    items.value = loadGuestCart();
    return;
  }

  cartLoading.value = true;
  try {
    if (guestItemsToMerge.length) {
      await syncGuestCartToServer(guestItemsToMerge);
    }
    await fetchServerCart();
  } catch {
    items.value = [];
  } finally {
    cartLoading.value = false;
  }
}

async function initCart() {
  const userId = getInitialUserId();
  const hasToken = !!localStorage.getItem('token');

  if (userId && hasToken) {
    currentUserId = userId;
    cartLoading.value = true;
    try {
      await fetchServerCart();
    } catch {
      items.value = [];
    } finally {
      cartLoading.value = false;
    }
  } else {
    currentUserId = null;
    items.value = loadGuestCart();
  }
}

initCart();

async function withServerSync(apiCall) {
  if (!currentUserId) return;
  try {
    const data = await apiCall();
    applyCartResponse(data);
  } catch {
    await fetchServerCart();
  }
}

export function useCart() {
  const count = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0),
  );

  const total = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0),
  );

  async function addItem(product, quantity = 1) {
    const existing = items.value.find((i) => i.id === product.id);

    if (currentUserId) {
      await withServerSync(() => addCartItem(product.id, quantity));
      return;
    }

    if (existing) {
      existing.quantity += quantity;
      return;
    }

    items.value.push({
      id: product.id,
      name: product.name,
      description: product.description || null,
      price: Number(product.price),
      category: product.category,
      image_url: product.image_url || product.image || null,
      quantity,
    });
  }

  async function setQuantity(id, quantity) {
    if (quantity <= 0) {
      await removeItem(id);
      return;
    }

    if (currentUserId) {
      await withServerSync(() => updateCartItem(id, quantity));
      return;
    }

    const item = items.value.find((i) => i.id === id);
    if (item) item.quantity = quantity;
  }

  async function removeItem(id) {
    if (currentUserId) {
      await withServerSync(() => removeCartItem(id));
      return;
    }

    items.value = items.value.filter((i) => i.id !== id);
  }

  async function clearCart() {
    if (currentUserId) {
      await withServerSync(() => clearCartApi());
      return;
    }

    items.value = [];
  }

  return {
    items,
    count,
    total,
    cartLoading,
    addItem,
    setQuantity,
    removeItem,
    clearCart,
  };
}
