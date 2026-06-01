<template>
  <div class="products">
    <h2 class="page-title">Каталог товаров</h2>

    <form class="filters card" @submit.prevent="applyFilters">
      <div class="filters-row">
        <input
          v-model="search"
          type="search"
          placeholder="Поиск по названию..."
          aria-label="Поиск"
        />
        <button type="submit" class="btn btn-primary btn-sm">Найти</button>
      </div>
      <div class="filters-row">
        <select v-model="category" aria-label="Категория">
          <option value="">Все категории</option>
          <option v-for="cat in PRODUCT_CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
        </select>
        <input
          v-model.number="priceMin"
          type="number"
          min="0"
          step="1"
          placeholder="Цена от"
          aria-label="Минимальная цена"
        />
        <input
          v-model.number="priceMax"
          type="number"
          min="0"
          step="1"
          placeholder="Цена до"
          aria-label="Максимальная цена"
        />
        <select v-model="sortBy" aria-label="Сортировка">
          <option value="created_at">По дате добавления</option>
          <option value="name">По названию</option>
          <option value="price">По цене</option>
        </select>
        <select v-model="sortDir" aria-label="Направление сортировки">
          <option value="desc">По убыванию</option>
          <option value="asc">По возрастанию</option>
        </select>
        <button type="button" class="btn btn-outline btn-sm" @click="resetFilters">
          Сбросить
        </button>
      </div>
    </form>

    <div v-if="loading && !products.length" class="grid skeleton-grid">
      <div v-for="n in 6" :key="n" class="product-card skeleton-card">
        <div class="skeleton-block skeleton-img" />
        <div class="skeleton-block skeleton-line" />
        <div class="skeleton-block skeleton-line short" />
      </div>
    </div>

    <div v-else-if="error" class="card error">{{ error }}</div>
    <div v-else-if="!products.length" class="empty-state">Товары не найдены</div>

    <div v-else class="grid">
      <article v-for="p in products" :key="p.id" class="product-card">
        <img v-if="productImage(p)" :src="productImage(p)" :alt="p.name" />
        <div v-else class="product-card-placeholder">Нет изображения</div>
        <div class="product-card-body">
          <div class="product-card-top">
            <h3>{{ p.name }}</h3>
            <button
              type="button"
              class="btn-favorite"
              :class="{ active: isFavorite(p.id) }"
              :title="isFavorite(p.id) ? 'Убрать из избранного' : 'В избранное'"
              :disabled="favoriteBusy === p.id"
              @click="handleFavorite(p)"
            >
              {{ isFavorite(p.id) ? '♥' : '♡' }}
            </button>
          </div>
          <p v-if="p.description" class="desc">{{ p.description }}</p>
          <p class="price font-digits">{{ formatPrice(p.price) }} ₽</p>
          <p class="cat">{{ p.category }}</p>
          <button type="button" class="btn btn-primary btn-sm" @click="addToCart(p)">
            В корзину
          </button>
        </div>
      </article>
    </div>

    <div v-if="loading && products.length" class="loading-inline">Обновление...</div>

    <div v-if="pagination.total > 0" class="catalog-footer">
      <p class="catalog-meta font-digits">
        Показано {{ products.length }} из {{ pagination.total }}
      </p>
      <button
        v-if="pagination.hasMore"
        type="button"
        class="btn btn-outline"
        :disabled="loadingMore"
        @click="loadMore"
      >
        {{ loadingMore ? 'Загрузка...' : 'Загрузить ещё' }}
      </button>
    </div>

    <p v-if="addedMsg" class="success-msg">{{ addedMsg }}</p>
    <p v-if="favoriteMsg" class="success-msg">{{ favoriteMsg }}</p>
    <p v-if="favoriteError" class="error">{{ favoriteError }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getProducts } from '../api';
import { PRODUCT_CATEGORIES } from '../constants/categories';
import { getProductImage, defaultImageForProductName } from '../utils/productImages';
import { useCart } from '../composables/useCart';
import { useFavorites } from '../composables/useFavorites';
import { useAuth } from '../composables/useAuth';

const products = ref([]);
const search = ref('');
const category = ref('');
const priceMin = ref('');
const priceMax = ref('');
const sortBy = ref('created_at');
const sortDir = ref('desc');
const page = ref(1);
const pagination = ref({ total: 0, hasMore: false, limit: 12 });
const loading = ref(true);
const loadingMore = ref(false);
const error = ref('');
const addedMsg = ref('');
const favoriteMsg = ref('');
const favoriteError = ref('');
const favoriteBusy = ref(null);

const { addItem } = useCart();
const { isFavorite, loadFavoriteIds, toggleFavorite } = useFavorites();
const { isLoggedIn } = useAuth();
const router = useRouter();

function productImage(p) {
  return getProductImage(p);
}

function formatPrice(price) {
  return Number(price).toLocaleString('ru-RU');
}

function buildParams(nextPage) {
  return {
    search: search.value.trim() || undefined,
    category: category.value || undefined,
    priceMin: priceMin.value !== '' && priceMin.value != null ? priceMin.value : undefined,
    priceMax: priceMax.value !== '' && priceMax.value != null ? priceMax.value : undefined,
    sortBy: sortBy.value,
    sortDir: sortDir.value,
    page: nextPage,
    limit: pagination.value.limit,
  };
}

async function fetchProducts(append = false) {
  if (append) {
    loadingMore.value = true;
  } else {
    loading.value = true;
    error.value = '';
  }

  try {
    const res = await getProducts(buildParams(page.value));
    if (append) {
      products.value = [...products.value, ...res.products];
    } else {
      products.value = res.products;
    }
    pagination.value = res.pagination ?? pagination.value;
  } catch (e) {
    error.value = e.message;
    if (!append) products.value = [];
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}

function applyFilters() {
  page.value = 1;
  fetchProducts();
}

function resetFilters() {
  search.value = '';
  category.value = '';
  priceMin.value = '';
  priceMax.value = '';
  sortBy.value = 'created_at';
  sortDir.value = 'desc';
  applyFilters();
}

function loadMore() {
  if (!pagination.value.hasMore || loadingMore.value) return;
  page.value += 1;
  fetchProducts(true);
}

function addToCart(product) {
  addItem({
    ...product,
    image_url: product.image_url || defaultImageForProductName(product.name),
  });
  addedMsg.value = `«${product.name}» добавлен в корзину`;
  setTimeout(() => { addedMsg.value = ''; }, 2000);
}

async function handleFavorite(product) {
  favoriteError.value = '';
  favoriteMsg.value = '';

  if (!isLoggedIn.value) {
    router.push({ path: '/auth/login', query: { redirect: '/products' } });
    return;
  }

  favoriteBusy.value = product.id;
  try {
    const added = await toggleFavorite(product.id);
    favoriteMsg.value = added
      ? `«${product.name}» добавлен в избранное`
      : `«${product.name}» удалён из избранного`;
    setTimeout(() => { favoriteMsg.value = ''; }, 2000);
  } catch (e) {
    favoriteError.value = e.message;
  } finally {
    favoriteBusy.value = null;
  }
}

onMounted(async () => {
  await loadFavoriteIds().catch(() => {});
  await fetchProducts();
});
</script>
