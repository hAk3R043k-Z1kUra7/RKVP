<template>
  <div class="dashboard">
    <nav class="dashboard-nav">
      <router-link to="/dashboard/products">Товары</router-link>
      <router-link v-if="isAdmin" to="/dashboard/users">Пользователи</router-link>
    </nav>
    <div class="dashboard-content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { useAuth } from '../composables/useAuth';

const { isAdmin } = useAuth();
</script>
