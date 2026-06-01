<template>
  <div class="prayers-page">
    <h1 class="page-title">Молитвы</h1>
    <p class="prayers-intro">
      Православные молитвы для домашнего чтения. Выберите молитву из списка.
    </p>

    <p v-if="!prayers.length" class="prayers-empty empty-state">
      Не удалось загрузить тексты молитв. Проверьте файл molitvas.txt.
    </p>

    <template v-else>
      <label class="prayers-mobile-picker" for="prayer-select">
        <span class="prayers-mobile-picker-label">Молитва</span>
        <select
          id="prayer-select"
          class="prayers-select"
          :value="selectedId ?? ''"
          @change="onMobileSelect"
        >
          <option v-for="prayer in prayers" :key="prayer.id" :value="prayer.id">
            {{ prayer.title }}
          </option>
        </select>
      </label>

      <div class="prayers-layout">
        <nav class="prayers-list card" aria-label="Список молитв">
          <button
            v-for="prayer in prayers"
            :key="prayer.id"
            type="button"
            class="prayers-list-item"
            :class="{ active: prayer.id === selectedId }"
            @click="selectPrayer(prayer.id)"
          >
            {{ prayer.title }}
          </button>
        </nav>

        <article v-if="selected" class="prayers-content card">
          <h2 class="prayers-content-title">{{ selected.title }}</h2>
          <div class="prayers-text">{{ selected.text }}</div>
        </article>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import molitvasRaw from '../assets/molitva/molitvas.txt?raw';
import { parsePrayers } from '../utils/parsePrayers';

const route = useRoute();
const router = useRouter();

const prayers = parsePrayers(molitvasRaw);
const selectedId = ref(prayers[0]?.id ?? null);

const selected = computed(() => prayers.find((p) => p.id === selectedId.value) ?? null);

function selectPrayer(id) {
  selectedId.value = id;
  router.replace({ query: { ...route.query, id } });
}

function onMobileSelect(event) {
  selectPrayer(event.target.value);
}

function syncFromQuery(id) {
  if (typeof id === 'string' && prayers.some((p) => p.id === id)) {
    selectedId.value = id;
  }
}

onMounted(() => {
  syncFromQuery(route.query.id);
});

watch(
  () => route.query.id,
  (id) => {
    syncFromQuery(id);
  },
);
</script>
