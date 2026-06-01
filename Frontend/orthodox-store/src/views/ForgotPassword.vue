<template>
  <div class="auth-form">
    <h2>Сброс пароля</h2>

    <div class="auth-tabs">
      <button
        type="button"
        class="btn btn-sm"
        :class="mode === 'email' ? 'btn-primary' : 'btn-outline'"
        @click="mode = 'email'"
      >
        По email
      </button>
      <button
        type="button"
        class="btn btn-sm"
        :class="mode === 'keyword' ? 'btn-primary' : 'btn-outline'"
        @click="mode = 'keyword'"
      >
        По ключевому слову
      </button>
    </div>

    <form v-if="mode === 'email'" novalidate @submit.prevent="submitEmail">
      <p class="auth-hint">
        На ваш email придёт ссылка для сброса (если аккаунт зарегистрирован). Ссылка действует 1 час.
      </p>
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
      <button type="submit" class="btn btn-primary" :disabled="loading">
        {{ loading ? 'Отправка...' : 'Отправить ссылку' }}
      </button>
      <p v-if="info" class="success-msg">{{ info }}</p>
      <p v-if="devLink" class="auth-dev-link">
        <strong>Режим разработки:</strong>
        <a :href="devLink">{{ devLink }}</a>
      </p>
      <p v-if="error" class="error">{{ error }}</p>
    </form>

    <form v-else novalidate @submit.prevent="submitKeyword">
      <p class="auth-hint">
        Укажите email, ключевое слово (задаётся при регистрации) и новый пароль.
      </p>
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
          v-model="recoveryKeyword"
          type="text"
          placeholder="Ключевое слово"
          autocomplete="off"
          :class="{ 'input-invalid': fieldErrors.recoveryKeyword }"
          @blur="validateKeyword"
        />
        <p v-if="fieldErrors.recoveryKeyword" class="error">{{ fieldErrors.recoveryKeyword }}</p>
      </div>
      <div>
        <input
          v-model="newPassword"
          type="password"
          placeholder="Новый пароль"
          :class="{ 'input-invalid': fieldErrors.newPassword }"
          @input="validateNewPassword"
          @blur="validateNewPassword"
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
        {{ loading ? 'Сохранение...' : 'Сменить пароль' }}
      </button>
      <p v-if="info" class="success-msg">{{ info }}</p>
      <p v-if="error" class="error">{{ error }}</p>
    </form>

    <p class="auth-back">
      <router-link to="/auth/login">Вернуться ко входу</router-link>
    </p>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { requestPasswordReset, resetPasswordByKeyword } from '../api';
import { getPasswordError, getPasswordChecks } from '../utils/passwordValidation';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const KEYWORD_MIN = 4;

const mode = ref('email');
const email = ref('');
const recoveryKeyword = ref('');
const newPassword = ref('');
const loading = ref(false);
const error = ref('');
const info = ref('');
const devLink = ref('');
const router = useRouter();
const fieldErrors = reactive({ email: '', recoveryKeyword: '', newPassword: '' });

const checks = computed(() => getPasswordChecks(newPassword.value));

function validateEmail() {
  fieldErrors.email = EMAIL_RE.test(email.value.trim()) ? '' : 'Введите корректный email';
}

function validateKeyword() {
  const v = recoveryKeyword.value.trim();
  fieldErrors.recoveryKeyword =
    v.length >= KEYWORD_MIN ? '' : `Ключевое слово — минимум ${KEYWORD_MIN} символа`;
}

function validateNewPassword() {
  fieldErrors.newPassword = getPasswordError(newPassword.value);
}

async function submitEmail() {
  validateEmail();
  if (fieldErrors.email) return;

  loading.value = true;
  error.value = '';
  info.value = '';
  devLink.value = '';
  try {
    const res = await requestPasswordReset(email.value.trim().toLowerCase());
    info.value = res.message || 'Проверьте почту.';
    if (res.devResetLink) devLink.value = res.devResetLink;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function submitKeyword() {
  validateEmail();
  validateKeyword();
  validateNewPassword();
  if (fieldErrors.email || fieldErrors.recoveryKeyword || fieldErrors.newPassword) return;

  loading.value = true;
  error.value = '';
  info.value = '';
  try {
    const res = await resetPasswordByKeyword({
      email: email.value.trim().toLowerCase(),
      recoveryKeyword: recoveryKeyword.value,
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
.auth-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.auth-hint {
  font-size: 0.9rem;
  color: var(--text-muted, #666);
  margin-bottom: 1rem;
  line-height: 1.45;
}

.auth-dev-link {
  margin-top: 0.75rem;
  font-size: 0.85rem;
  word-break: break-all;
}

.auth-back {
  margin-top: 1.25rem;
}
</style>
