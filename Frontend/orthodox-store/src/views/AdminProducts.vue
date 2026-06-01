<template>
  <div class="admin-products">
    <div class="admin-header">
      <h2 class="page-title" style="margin: 0">Управление каталогом</h2>
      <router-link to="/dashboard/products/new" class="btn btn-primary">Добавить товар</router-link>
    </div>

    <div v-if="loading" class="loading">Загрузка...</div>
    <div v-else-if="!products.length" class="empty-state card">Товаров пока нет</div>

    <div v-else class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Название</th>
            <th>Категория</th>
            <th>Цена</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in products" :key="p.id">
            <td>{{ p.name }}</td>
            <td>{{ p.category }}</td>
            <td class="font-digits">{{ p.price }} ₽</td>
            <td class="actions">
              <router-link :to="`/dashboard/products/${p.id}/edit`" class="btn btn-outline btn-sm">
                Изменить
              </router-link>
              <button class="btn btn-danger btn-sm" @click="removeProduct(p.id)">
                Удалить
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getProducts, deleteProduct } from '../api';

const products = ref([]);
const loading = ref(true);
const error = ref('');

async function loadProducts() {
  loading.value = true;
  error.value = '';
  try {
    const res = await getProducts();
    products.value = res.products;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function removeProduct(id) {
  if (!confirm('Удалить этот товар?')) return;
  try {
    await deleteProduct(id);
    products.value = products.value.filter((p) => p.id !== id);
  } catch (e) {
    error.value = e.message;
  }
}

onMounted(loadProducts);
</script>
