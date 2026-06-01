<template>
  <div class="name-generator">
    <h1 class="page-title">Генератор имён для крещения</h1>
    <p class="name-intro">
      Выберите пол и дату — генератор предложит имя святого из православного календаря,
      чья память совпадает с этим днём.
    </p>

    <div class="name-controls card">
      <div class="name-controls-row">
        <div class="form-group">
          <label for="gender">Пол ребёнка</label>
          <select id="gender" v-model="gender">
            <option value="male">Мальчик</option>
            <option value="female">Девочка</option>
          </select>
        </div>
        <div class="form-group">
          <label for="month">Месяц</label>
          <select id="month" v-model.number="month">
            <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
          </select>
        </div>
        <div class="form-group">
          <label for="day">День</label>
          <select id="day" v-model.number="day">
            <option v-for="d in daysInMonth" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>
      </div>

      <div class="form-actions">
        <button class="btn btn-primary" :disabled="loading" @click="generate">
          {{ loading ? 'Подбираем...' : 'Подобрать имя' }}
        </button>
        <button class="btn btn-outline" :disabled="loadingList" @click="loadAllNames">
          {{ loadingList ? 'Загрузка...' : 'Все имена на эту дату' }}
        </button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <div v-if="result" class="name-result card">
      <p class="name-result-label">Рекомендуемое имя для крещения</p>
      <h2 class="name-result-title">{{ result.name }}</h2>
      <p class="name-result-saint">{{ result.saint_title }}</p>
      <p v-if="result.description" class="name-result-desc">{{ result.description }}</p>
      <p class="name-result-date font-digits">
        День памяти: {{ formatDate(result.month, result.day) }}
      </p>
    </div>

    <div v-if="allNames.length" class="name-list card">
      <h3>Все имена на {{ formatDate(month, day) }}</h3>
      <ul>
        <li v-for="item in allNames" :key="item.id">
          <strong>{{ item.name }}</strong>
          <span> — {{ item.saint_title }}</span>
          <span class="name-gender-tag">{{ item.gender === 'male' ? 'м' : 'ж' }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { getRandomSaintName, getSaintNames } from '../api';

const months = [
  { value: 1, label: 'Январь' },
  { value: 2, label: 'Февраль' },
  { value: 3, label: 'Март' },
  { value: 4, label: 'Апрель' },
  { value: 5, label: 'Май' },
  { value: 6, label: 'Июнь' },
  { value: 7, label: 'Июль' },
  { value: 8, label: 'Август' },
  { value: 9, label: 'Сентябрь' },
  { value: 10, label: 'Октябрь' },
  { value: 11, label: 'Ноябрь' },
  { value: 12, label: 'Декабрь' },
];

const monthNames = months.map((m) => m.label);

const now = new Date();
const gender = ref('male');
const month = ref(now.getMonth() + 1);
const day = ref(now.getDate());
const result = ref(null);
const allNames = ref([]);
const loading = ref(false);
const loadingList = ref(false);
const error = ref('');

const daysInMonth = computed(() => {
  const count = new Date(2000, month.value, 0).getDate();
  return Array.from({ length: count }, (_, i) => i + 1);
});

watch(month, () => {
  const max = daysInMonth.value.length;
  if (day.value > max) day.value = max;
  allNames.value = [];
  result.value = null;
});

watch([month, day, gender], () => {
  allNames.value = [];
});

function formatDate(m, d) {
  return `${d} ${monthNames[m - 1]?.toLowerCase() ?? ''}`;
}

async function generate() {
  loading.value = true;
  error.value = '';
  result.value = null;
  try {
    const data = await getRandomSaintName({
      gender: gender.value,
      month: month.value,
      day: day.value,
    });
    result.value = data.name;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function loadAllNames() {
  loadingList.value = true;
  error.value = '';
  try {
    const data = await getSaintNames({ month: month.value, day: day.value });
    allNames.value = data.names;
    if (!data.names.length) {
      error.value = 'Для этой даты пока нет имён в базе.';
    }
  } catch (e) {
    error.value = e.message;
  } finally {
    loadingList.value = false;
  }
}

onMounted(() => {
  const max = daysInMonth.value.length;
  if (day.value > max) day.value = max;
});
</script>
