<template>
  <div class="cabinet">
    <nav class="cabinet-nav">
      <router-link to="/cabinet/profile">Профиль</router-link>
      <router-link to="/cabinet/orders">Заказы</router-link>
      <router-link to="/cabinet/favorites">Избранное</router-link>
      <button type="button" class="btn btn-outline btn-sm cabinet-logout" @click="signOut">
        Выйти
      </button>
    </nav>
    <div class="cabinet-content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { useLogout } from '../composables/useLogout';

const { signOut } = useLogout();
</script>
