<template>
  <div class="auth-form">
    <h2>Регистрация</h2>
    <form novalidate @submit.prevent="handleRegister">
      <div>
        <input
          v-model="name"
          type="text"
          placeholder="Имя"
          :class="{ 'input-invalid': fieldErrors.name }"
          @blur="validateField('name')"
        />
        <p v-if="fieldErrors.name" class="error">{{ fieldErrors.name }}</p>
      </div>
      <div>
        <input
          v-model="email"
          type="email"
          placeholder="Email"
          :class="{ 'input-invalid': fieldErrors.email }"
          @blur="validateField('email')"
        />
        <p v-if="fieldErrors.email" class="error">{{ fieldErrors.email }}</p>
      </div>
      <div>
        <input
          v-model="password"
          type="password"
          placeholder="Пароль"
          :class="{ 'input-invalid': fieldErrors.password }"
          @input="validateField('password')"
          @blur="validateField('password')"
        />
        <ul class="password-rules" aria-live="polite">
          <li :class="{ ok: checks.minLength }">Не короче 8 символов</li>
          <li :class="{ ok: checks.lower }">Строчная буква</li>
          <li :class="{ ok: checks.upper }">Заглавная буква</li>
          <li :class="{ ok: checks.digit }">Цифра</li>
          <li :class="{ ok: checks.special }">Спецсимвол</li>
        </ul>
        <p v-if="fieldErrors.password" class="error">{{ fieldErrors.password }}</p>
      </div>
      <div>
        <input
          v-model="recoveryKeyword"
          type="text"
          placeholder="Ключевое слово для сброса пароля"
          autocomplete="off"
          :class="{ 'input-invalid': fieldErrors.recoveryKeyword }"
          @blur="validateField('recoveryKeyword')"
        />
        <p class="field-hint">Запомните его — понадобится, если забудете пароль (мин. 4 символа).</p>
        <p v-if="fieldErrors.recoveryKeyword" class="error">{{ fieldErrors.recoveryKeyword }}</p>
      </div>
      <button type="submit" class="btn btn-primary" :disabled="loading">
        {{ loading ? 'Регистрация...' : 'Зарегистрироваться' }}
      </button>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
    <p>Уже есть аккаунт? <router-link to="/auth/login">Войти</router-link></p>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiFetch } from '../api';
import { useAuth } from '../composables/useAuth';
import { getPasswordError, getPasswordChecks } from '../utils/passwordValidation';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const name = ref('');
const email = ref('');
const password = ref('');
const recoveryKeyword = ref('');
const loading = ref(false);
const error = ref('');
const fieldErrors = reactive({ name: '', email: '', password: '', recoveryKeyword: '' });
const KEYWORD_MIN = 4;
const router = useRouter();
const route = useRoute();
const { setAuth } = useAuth();

const checks = computed(() => getPasswordChecks(password.value));

function validateField(field) {
  if (field === 'name') {
    const v = name.value.trim();
    fieldErrors.name = v.length < 2 ? 'Имя должно содержать минимум 2 символа' : '';
  }
  if (field === 'email') {
    const v = email.value.trim();
    fieldErrors.email = !EMAIL_RE.test(v) ? 'Введите корректный email' : '';
  }
  if (field === 'password') {
    fieldErrors.password = getPasswordError(password.value);
  }
  if (field === 'recoveryKeyword') {
    const v = recoveryKeyword.value.trim();
    fieldErrors.recoveryKeyword =
      v.length >= KEYWORD_MIN ? '' : `Ключевое слово — минимум ${KEYWORD_MIN} символа`;
  }
}

function validateForm() {
  validateField('name');
  validateField('email');
  validateField('password');
  validateField('recoveryKeyword');
  return (
    !fieldErrors.name &&
    !fieldErrors.email &&
    !fieldErrors.password &&
    !fieldErrors.recoveryKeyword
  );
}

async function handleRegister() {
  if (!validateForm()) return;

  loading.value = true;
  error.value = '';
  try {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: name.value.trim(),
        email: email.value.trim().toLowerCase(),
        password: password.value,
        recoveryKeyword: recoveryKeyword.value,
      }),
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

<style scoped>
.field-hint {
  font-size: 0.85rem;
  color: var(--text-muted, #666);
  margin-top: 0.35rem;
}
</style>
