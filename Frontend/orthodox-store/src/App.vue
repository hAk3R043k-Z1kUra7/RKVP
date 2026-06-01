<template>
  <div class="app">
    <div class="app-shell">
      <Header />
      <main class="container main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import Header from './components/Header.vue';
</script>
