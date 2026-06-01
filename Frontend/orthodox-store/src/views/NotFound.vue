<template>
  <div class="error-page">
    <h1 class="page-title font-digits">404 - Тут Бога нет</h1>
    <div class="card">
      <p>Страница не найдена. Возможно, ссылка устарела или была введена с ошибкой.</p>
      <div class="form-actions">
        <router-link to="/" class="btn btn-primary">На главную</router-link>
        <router-link to="/products" class="btn btn-outline">В каталог</router-link>
      </div>
    </div>
  </div>
</template>
