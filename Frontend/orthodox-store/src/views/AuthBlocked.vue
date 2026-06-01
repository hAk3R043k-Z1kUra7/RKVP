<template>
  <div class="error-page">
    <h1 class="page-title">Доступ ограничен</h1>
    <div class="card">
      <p>Вы уже вошли в аккаунт. Страницы входа и регистрации доступны только гостям.</p>
      <p v-if="user?.name" class="auth-blocked-user">
        Сейчас вы авторизованы как <strong>{{ user.name }}</strong>.
      </p>
      <div class="form-actions">
        <router-link to="/cabinet/profile" class="btn btn-primary">Личный кабинет</router-link>
        <router-link to="/" class="btn btn-outline">На главную</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuth } from '../composables/useAuth';

const { user } = useAuth();
</script>
