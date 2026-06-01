<template>
  <div class="auth-form">
    <h2>Новый пароль</h2>

    <p v-if="!token" class="error">
      Ссылка недействительна. <router-link to="/auth/forgot-password">Запросите сброс снова</router-link>.
    </p>

    <form v-else novalidate @submit.prevent="submit">
      <p class="auth-hint">Придумайте новый пароль для входа в аккаунт.</p>
      <div>
        <input
          v-model="newPassword"
          type="password"
          placeholder="Новый пароль"
          :class="{ 'input-invalid': fieldErrors.newPassword }"
          @input="validatePassword"
          @blur="validatePassword"
        />
        <ul v-if="newPassword" class="password-rules" aria-live="polite">
          <li :class="{ ok: checks.minLength }">Не короче 8 символов</li>
          <li :class="{ ok: checks.lower }">Строчная буква</li>
          <li :class="{ ok: checks.upper }">Заглавная буква</li>
          <li :class="{ ok: checks.digit }">Цифра</li>
          <li :class="{ ok: checks.special }">Спецсимвол</li>
        </ul>
        <p v-if="fieldErrors.newPassword" class="error">{{ fieldErrors.newPassword }}</p>
      </div>
      <button type="submit" class="btn btn-primary" :disabled="loading">
        {{ loading ? 'Сохранение...' : 'Сохранить пароль' }}
      </button>
      <p v-if="info" class="success-msg">{{ info }}</p>
      <p v-if="error" class="error">{{ error }}</p>
    </form>

    <p class="auth-back">
      <router-link to="/auth/login">Войти</router-link>
    </p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { resetPasswordByToken } from '../api';
import { getPasswordError, getPasswordChecks } from '../utils/passwordValidation';

const route = useRoute();
const router = useRouter();
const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''));
const newPassword = ref('');
const loading = ref(false);
const error = ref('');
const info = ref('');
const fieldErrors = ref({ newPassword: '' });

const checks = computed(() => getPasswordChecks(newPassword.value));

function validatePassword() {
  fieldErrors.value.newPassword = getPasswordError(newPassword.value);
}

async function submit() {
  validatePassword();
  if (fieldErrors.value.newPassword) return;

  loading.value = true;
  error.value = '';
  try {
    const res = await resetPasswordByToken({
      token: token.value,
      newPassword: newPassword.value,
    });
    info.value = res.message || 'Пароль обновлён.';
    setTimeout(() => router.push('/auth/login'), 1500);
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-hint {
  font-size: 0.9rem;
  color: var(--text-muted, #666);
  margin-bottom: 1rem;
}

.auth-back {
  margin-top: 1.25rem;
}
</style>
