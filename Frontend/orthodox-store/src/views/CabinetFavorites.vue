<template>
  <div>
    <h2 class="page-title">Избранное</h2>

    <div v-if="loading" class="loading">Загрузка избранного...</div>
    <div v-else-if="error" class="card error">{{ error }}</div>
    <div v-else-if="!items.length" class="card empty-state">
      <p>В избранном пока нет товаров.</p>
      <router-link to="/products" class="btn btn-primary">Перейти в каталог</router-link>
    </div>

    <div v-else class="grid">
      <article v-for="p in items" :key="p.id" class="product-card">
        <img v-if="productImage(p)" :src="productImage(p)" :alt="p.name" />
        <div v-else class="product-card-placeholder">Нет изображения</div>
        <div class="product-card-body">
          <h3>{{ p.name }}</h3>
          <p class="price font-digits">{{ formatPrice(p.price) }} ₽</p>
          <p class="cat">{{ p.category }}</p>
          <div class="form-actions">
            <button type="button" class="btn btn-primary btn-sm" @click="addToCart(p)">
              В корзину
            </button>
            <button
              type="button"
              class="btn btn-outline btn-sm"
              :disabled="removingId === p.id"
              @click="removeFromFavorites(p)"
            >
              Убрать
            </button>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getFavorites, removeFavorite } from '../api';
import { getProductImage } from '../utils/productImages';
import { useCart } from '../composables/useCart';
import { useFavorites } from '../composables/useFavorites';

const items = ref([]);
const loading = ref(true);
const error = ref('');
const removingId = ref(null);

const { addItem } = useCart();
const { clearFavoritesCache, loadFavoriteIds } = useFavorites();

function productImage(p) {
  return getProductImage(p);
}

function formatPrice(price) {
  return Number(price).toLocaleString('ru-RU');
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const data = await getFavorites();
    items.value = data.items ?? [];
  } catch (e) {
    error.value = e.message;
    items.value = [];
  } finally {
    loading.value = false;
  }
}

function addToCart(product) {
  addItem(product);
}

async function removeFromFavorites(product) {
  removingId.value = product.id;
  try {
    await removeFavorite(product.id);
    items.value = items.value.filter((i) => i.id !== product.id);
    clearFavoritesCache();
    await loadFavoriteIds();
  } catch (e) {
    error.value = e.message;
  } finally {
    removingId.value = null;
  }
}

onMounted(load);
</script>
