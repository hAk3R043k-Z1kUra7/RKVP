<template>
  <div class="auth-form">
    <h2>Вход</h2>
    <form novalidate @submit.prevent="handleLogin">
      <div>
        <input
          v-model="email"
          type="email"
          placeholder="Email"
          :class="{ 'input-invalid': fieldErrors.email }"
          @blur="validateEmail"
        />
        <p v-if="fieldErrors.email" class="error">{{ fieldErrors.email }}</p>
      </div>
      <div>
        <input
          v-model="password"
          type="password"
          placeholder="Пароль"
          :class="{ 'input-invalid': fieldErrors.password }"
          @blur="validatePassword"
        />
        <p v-if="fieldErrors.password" class="error">{{ fieldErrors.password }}</p>
      </div>
      <button type="submit" class="btn btn-primary" :disabled="loading">
        {{ loading ? 'Вход...' : 'Войти' }}
      </button>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
    <p>Нет аккаунта? <router-link to="/auth/register">Зарегистрироваться</router-link></p>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
import { useRoute, useRouter } from 'vue-router';
import { apiFetch } from '../api';
import { useAuth } from '../composables/useAuth';

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const fieldErrors = reactive({ email: '', password: '' });
const router = useRouter();
const route = useRoute();
const { setAuth } = useAuth();

function validateEmail() {
  fieldErrors.email = EMAIL_RE.test(email.value.trim()) ? '' : 'Введите корректный email';
}

function validatePassword() {
  fieldErrors.password = password.value ? '' : 'Введите пароль';
}

function validateForm() {
  validateEmail();
  validatePassword();
  return !fieldErrors.email && !fieldErrors.password;
}

async function handleLogin() {
  if (!validateForm()) return;

  loading.value = true;
  error.value = '';
  try {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.value, password: password.value }),
    });
    await setAuth(res);
    const redirect = route.query.redirect || '/cabinet/profile';
    router.push(typeof redirect === 'string' ? redirect : '/cabinet/profile');
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>
