<template>
  <div>
    <h2 class="page-title">Личный кабинет</h2>

    <div v-if="loading" class="loading">Загрузка...</div>

    <template v-else-if="user">
      <div class="card" style="margin-bottom: 1.5rem">
        <h3 style="margin-bottom: 1rem">Данные аккаунта</h3>
        <div class="info-row"><strong>Email:</strong> <span>{{ user.email }}</span></div>
        <div class="info-row">
          <strong>Регистрация:</strong>
          <span>{{ new Date(user.created_at).toLocaleDateString('ru-RU') }}</span>
        </div>
        <div class="info-row" v-if="user.role === 'admin'">
          <strong>Роль:</strong> <span>Администратор</span>
        </div>
        <div class="info-row" v-else-if="user.role === 'seller'">
          <strong>Роль:</strong> <span>Продавец</span>
        </div>
      </div>

      <div class="card">
        <h3 style="margin-bottom: 1rem">Редактировать профиль</h3>
        <form @submit.prevent="saveProfile">
          <div class="form-group">
            <label for="name">Имя</label>
            <input id="name" v-model="form.name" type="text" required minlength="2" />
          </div>
          <div class="form-group">
            <label for="password">Новый пароль</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              placeholder="Оставьте пустым, если не меняете"
              :class="{ 'input-invalid': passwordError }"
              @input="validatePasswordField"
              @blur="validatePasswordField"
            />
            <ul v-if="form.password" class="password-rules" aria-live="polite">
              <li :class="{ ok: passwordChecks.minLength }">Не короче 8 символов</li>
              <li :class="{ ok: passwordChecks.lower }">Строчная буква</li>
              <li :class="{ ok: passwordChecks.upper }">Заглавная буква</li>
              <li :class="{ ok: passwordChecks.digit }">Цифра</li>
              <li :class="{ ok: passwordChecks.special }">Спецсимвол</li>
            </ul>
            <p v-if="passwordError" class="error">{{ passwordError }}</p>
          </div>
          <div class="form-group" v-if="form.password">
            <label for="currentPassword">Текущий пароль</label>
            <input
              id="currentPassword"
              v-model="form.currentPassword"
              type="password"
              required
            />
          </div>
          <p v-if="error" class="error">{{ error }}</p>
          <p v-if="success" class="success-msg">{{ success }}</p>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Сохранение...' : 'Сохранить' }}
            </button>
          </div>
        </form>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuth } from '../composables/useAuth';
import { updateProfile } from '../api';
import { getPasswordError, getPasswordChecks } from '../utils/passwordValidation';

const { user, refreshUser } = useAuth();
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const success = ref('');
const form = ref({ name: '', password: '', currentPassword: '' });
const passwordError = ref('');

const passwordChecks = computed(() => getPasswordChecks(form.value.password));

function validatePasswordField() {
  passwordError.value = form.value.password ? getPasswordError(form.value.password) : '';
}

onMounted(async () => {
  try {
    await refreshUser();
    if (user.value) form.value.name = user.value.name;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
});

async function saveProfile() {
  if (form.value.password) {
    validatePasswordField();
    if (passwordError.value) return;
    if (!form.value.currentPassword) {
      error.value = 'Укажите текущий пароль';
      return;
    }
  }

  saving.value = true;
  error.value = '';
  success.value = '';
  try {
    const body = { name: form.value.name.trim() };
    if (form.value.password) {
      body.password = form.value.password;
      body.currentPassword = form.value.currentPassword;
    }
    const res = await updateProfile(body);
    user.value = res.user;
    localStorage.setItem('user', JSON.stringify(res.user));
    form.value.password = '';
    form.value.currentPassword = '';
    success.value = 'Профиль обновлён';
  } catch (e) {
    error.value = e.message;
  } finally {
    saving.value = false;
  }
}
</script>
