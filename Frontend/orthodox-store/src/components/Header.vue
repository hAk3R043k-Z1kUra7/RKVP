<template>
  <header class="header">
    <nav class="nav" aria-label="Основная навигация">
      <router-link to="/" class="logo" @click="closeMenu">Святое Торжище</router-link>

      <button
        type="button"
        class="nav-toggle"
        :aria-expanded="menuOpen"
        aria-controls="primary-nav"
        @click="menuOpen = !menuOpen"
      >
        <span class="sr-only">{{ menuOpen ? 'Закрыть меню' : 'Открыть меню' }}</span>
        <span class="nav-toggle-bar" aria-hidden="true"></span>
        <span class="nav-toggle-bar" aria-hidden="true"></span>
        <span class="nav-toggle-bar" aria-hidden="true"></span>
      </button>

      <div id="primary-nav" class="nav-links" :class="{ 'nav-links--open': menuOpen }">
        <router-link to="/products" @click="closeMenu">Товары</router-link>
        <router-link to="/prayers" @click="closeMenu">Молитвы</router-link>
        <router-link to="/candle" @click="closeMenu">Свеча онлайн</router-link>
        <router-link to="/name-generator" @click="closeMenu">Имена для крещения</router-link>
        <router-link to="/cart" class="nav-cart" @click="closeMenu">
          Корзина
          <span v-if="count" class="cart-badge font-digits">{{ count }}</span>
        </router-link>
        <template v-if="isLoggedIn">
          <span v-if="user?.name" class="nav-user">{{ user.name }}</span>
          <router-link to="/cabinet/profile" @click="closeMenu">Личный кабинет</router-link>
          <router-link
            v-if="canManageProducts"
            to="/dashboard/products"
            class="nav-admin"
            @click="closeMenu"
          >
            Управление
          </router-link>
        </template>
        <template v-else>
          <router-link to="/auth/login" @click="closeMenu">Войти</router-link>
          <router-link to="/auth/register" @click="closeMenu">Регистрация</router-link>
        </template>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { useCart } from '../composables/useCart';
import { useFavorites } from '../composables/useFavorites';

const route = useRoute();
const menuOpen = ref(false);

const { isLoggedIn, user, canManageProducts, refreshUser } = useAuth();
const { loadFavoriteIds } = useFavorites();
const { count } = useCart();

function closeMenu() {
  menuOpen.value = false;
}

watch(
  () => route.fullPath,
  () => {
    closeMenu();
  },
);

onMounted(() => {
  if (isLoggedIn.value) {
    refreshUser().catch(() => {});
    loadFavoriteIds().catch(() => {});
  }
});
</script>
