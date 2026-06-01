<template>
  <div>
    <h2 class="page-title">Управление пользователями</h2>
    <p class="placeholder-section" style="margin-bottom: 1rem">
      Администратор назначает роль <strong>продавец</strong> — тогда пользователь может добавлять
      и редактировать товары в панели «Управление».
    </p>

    <div v-if="loading" class="loading">Загрузка...</div>
    <div v-else-if="error" class="card error">{{ error }}</div>

    <div v-else class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Имя</th>
            <th>Email</th>
            <th>Роль</th>
            <th>Действие</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>{{ u.name }}</td>
            <td>{{ u.email }}</td>
            <td>{{ roleLabel(u.role) }}</td>
            <td>
              <select
                :value="u.role"
                class="role-select"
                :disabled="u.id === currentUserId && u.role === 'admin'"
                @change="changeRole(u.id, $event.target.value)"
              >
                <option value="user">Покупатель</option>
                <option value="seller">Продавец</option>
                <option value="admin">Администратор</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="success" class="success-msg">{{ success }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { apiFetch } from '../api';
import { useAuth } from '../composables/useAuth';

const { user } = useAuth();
const users = ref([]);
const loading = ref(true);
const error = ref('');
const success = ref('');

const currentUserId = user.value?.id;

const roleLabels = {
  user: 'Покупатель',
  seller: 'Продавец',
  admin: 'Администратор',
};

function roleLabel(role) {
  return roleLabels[role] || role;
}

async function loadUsers() {
  loading.value = true;
  error.value = '';
  try {
    const res = await apiFetch('/admin/users');
    users.value = res.users;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function changeRole(userId, role) {
  success.value = '';
  error.value = '';
  try {
    const res = await apiFetch(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    const idx = users.value.findIndex((u) => u.id === userId);
    if (idx !== -1) users.value[idx] = res.user;
    success.value = 'Роль обновлена';
  } catch (e) {
    error.value = e.message;
    await loadUsers();
  }
}

onMounted(loadUsers);
</script>

<style scoped>
.role-select {
  padding: 0.4rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-family: var(--font-latin);
  min-width: 140px;
}
</style>
