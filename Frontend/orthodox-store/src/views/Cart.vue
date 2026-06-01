<template>
  <div class="cart-page">
    <h2 class="page-title">Корзина</h2>

    <p v-if="cartLoading" class="loading">Загрузка корзины...</p>

    <div v-else-if="!items.length" class="card empty-state">
      <p>Корзина пуста</p>
      <router-link to="/products" class="btn btn-primary">Перейти в каталог</router-link>
    </div>

    <template v-else>
      <div class="cart-list">
        <article v-for="item in items" :key="item.id" class="cart-item card">
          <div class="cart-item-media">
            <img
              v-if="itemImage(item)"
              :src="itemImage(item)"
              :alt="item.name"
              class="cart-item-img"
            />
            <div v-else class="cart-item-placeholder">Нет изображения</div>
          </div>

          <div class="cart-item-body">
            <h3>{{ item.name }}</h3>
            <p class="cat">{{ item.category }}</p>
            <p v-if="item.description" class="cart-item-desc">{{ item.description }}</p>
            <p class="cart-item-unit-price font-digits">
              {{ formatPrice(item.price) }} ₽ за шт.
            </p>
          </div>

          <div class="cart-item-aside">
            <p class="cart-line-total font-digits">
              {{ formatPrice(item.price * item.quantity) }} ₽
            </p>
            <p class="cart-item-qty-label">Количество</p>
            <div class="cart-item-controls">
              <button
                type="button"
                class="btn btn-outline btn-sm"
                aria-label="Уменьшить"
                @click="setQuantity(item.id, item.quantity - 1)"
              >
                −
              </button>
              <span class="cart-item-qty font-digits">{{ item.quantity }}</span>
              <button
                type="button"
                class="btn btn-outline btn-sm"
                aria-label="Увеличить"
                @click="setQuantity(item.id, item.quantity + 1)"
              >
                +
              </button>
            </div>
            <button
              type="button"
              class="btn btn-danger btn-sm cart-item-remove"
              @click="removeItem(item.id)"
            >
              Удалить
            </button>
          </div>
        </article>
      </div>

      <div class="card cart-summary">
        <p class="cart-summary-count">
          {{ items.length }} {{ positionsLabel }} ·
          <span class="font-digits">{{ count }}</span> {{ unitsLabel }}
        </p>
        <p class="cart-summary-total">
          Итого: <strong class="font-digits">{{ formatPrice(total) }} ₽</strong>
        </p>
        <p v-if="checkoutError" class="error">{{ checkoutError }}</p>
        <p v-if="checkoutSuccess" class="success-msg">{{ checkoutSuccess }}</p>
        <div class="form-actions">
          <button type="button" class="btn btn-outline" @click="clearCart">Очистить</button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="checkoutLoading"
            @click="handleCheckout"
          >
            {{ checkoutLoading ? 'Оформление...' : 'Оформить заказ' }}
          </button>
          <router-link to="/products" class="btn btn-outline">Продолжить покупки</router-link>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { createOrder } from '../api';
import { useCart } from '../composables/useCart';
import { useAuth } from '../composables/useAuth';
import { getCartItemImage } from '../utils/productImages';

const { items, count, total, cartLoading, setQuantity, removeItem, clearCart } = useCart();
const { isLoggedIn } = useAuth();
const router = useRouter();

const checkoutLoading = ref(false);
const checkoutError = ref('');
const checkoutSuccess = ref('');

async function handleCheckout() {
  checkoutError.value = '';
  checkoutSuccess.value = '';

  if (!isLoggedIn.value) {
    router.push({ path: '/auth/login', query: { redirect: '/cart' } });
    return;
  }

  checkoutLoading.value = true;
  try {
    const data = await createOrder();
    await clearCart();
    checkoutSuccess.value = `Заказ оформлен на сумму ${Number(data.order.total).toLocaleString('ru-RU')} ₽`;
    setTimeout(() => router.push('/cabinet/orders'), 1500);
  } catch (e) {
    checkoutError.value = e.message;
  } finally {
    checkoutLoading.value = false;
  }
}

function formatPrice(price) {
  return Number(price).toLocaleString('ru-RU');
}

function itemImage(item) {
  return getCartItemImage(item);
}

function pluralize(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

const positionsLabel = computed(() =>
  pluralize(items.value.length, 'позиция', 'позиции', 'позиций'),
);

const unitsLabel = computed(() =>
  pluralize(count.value, 'товар', 'товара', 'товаров'),
);
</script>
