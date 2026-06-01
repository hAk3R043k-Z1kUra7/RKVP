<template>
  <header class="header">
    <nav class="container nav">
      <router-link to="/" class="logo">
         Православный магазин</router-link>
      <div class="nav-links">
        <router-link to="/products">Товары</router-link>
        <template v-if="isLoggedIn">
          <router-link to="/profile">Профиль</router-link>
          <button @click="logout">Выйти</button>
        </template>
        <template v-else>
          <router-link to="/auth/login">Войти</router-link>
        </template>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const isLoggedIn = ref(!!localStorage.getItem('token'));
const router = useRouter();

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  isLoggedIn.value = false;
  router.push('/auth/login');
}
</script>

<style scoped>
/* Применяем Akathistos только внутри хедера */
.header {
  font-family: 'AkathistosFont', system-ui, -apple-system, sans-serif;
  background: var(--surface);
  box-shadow: var(--shadow);
  position: sticky;
  top: 0;
  z-index: 100;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.logo {
  font-family: 'AkathistosFont', system-ui, -apple-system, sans-serif;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--primary);
  text-decoration: none;
  transition: opacity 0.2s;
}
.logo:hover { opacity: 0.85; }

.nav-links {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-links a {
  color: var(--text);
  text-decoration: none;
  font-weight: 500;
  padding: 0.4rem 0;
  transition: color 0.2s;
}

.nav-links a.router-link-active {
  color: var(--primary);
  border-bottom: 2px solid var(--primary);
}

.nav-links a:hover { color: var(--primary); }

.nav-links button {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
  padding: 0.5rem 1rem;
  border-radius: var(--radius);
  cursor: pointer;
  font-weight: 500;
  font-family: inherit; /* Наследует Akathistos у .header */
  transition: all 0.2s;
}

.nav-links button:hover {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}
</style>
