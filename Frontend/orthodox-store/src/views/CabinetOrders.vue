<template>
  <div>
    <h2 class="page-title">История заказов</h2>

    <div v-if="loading" class="loading">Загрузка заказов...</div>
    <div v-else-if="error" class="card error">{{ error }}</div>
    <div v-else-if="!orders.length" class="card empty-state">
      <p>У вас пока нет заказов.</p>
      <router-link to="/products" class="btn btn-primary">Перейти в каталог</router-link>
    </div>

    <div v-else class="orders-list">
      <article v-for="order in orders" :key="order.id" class="card order-card">
        <header class="order-card-header">
          <span class="font-digits">Заказ от {{ formatDate(order.createdAt) }}</span>
          <span class="order-status">{{ statusLabel(order.status) }}</span>
        </header>
        <ul class="order-items">
          <li v-for="item in order.items" :key="item.id">
            {{ item.productName }}
            <span class="font-digits">
              × {{ item.quantity }} — {{ formatPrice(item.price * item.quantity) }} ₽
            </span>
          </li>
        </ul>
        <p class="order-total font-digits">
          Итого: <strong>{{ formatPrice(order.total) }} ₽</strong>
        </p>
      </article>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getOrders } from '../api';

const orders = ref([]);
const loading = ref(true);
const error = ref('');

const STATUS_LABELS = {
  new: 'Новый',
  processing: 'В обработке',
  completed: 'Выполнен',
  cancelled: 'Отменён',
};

function formatPrice(price) {
  return Number(price).toLocaleString('ru-RU');
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusLabel(status) {
  return STATUS_LABELS[status] || status;
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const data = await getOrders();
    orders.value = data.orders ?? [];
  } catch (e) {
    error.value = e.message;
    orders.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
