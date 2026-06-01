<template>
  <div class="candle-page">
    <h1 class="page-title">Поставить свечу онлайн</h1>
    <p class="candle-intro">
      Зажгите виртуальную свечу в молитве. У каждого посетителя и аккаунта — своя свеча:
      она загорается только после нажатия кнопки. Счётчик показывает, сколько людей
      сегодня побывало на сайте.
    </p>

    <div class="candle-scene card">
      <div class="candle-stage" :class="{ 'candle-stage--lit': isLit }">
        <div v-if="isLit" class="candle-ambient" aria-hidden="true" />

        <div class="candle-holder">
          <div class="candle-body" :class="{ lit: isLit }">
            <div v-if="isLit" class="flame" aria-hidden="true">
              <span class="flame-layer flame-layer--outer" />
              <span class="flame-layer flame-layer--mid" />
              <span class="flame-layer flame-layer--core" />
            </div>
            <div class="wick" />
          </div>
          <div class="candle-base" />
        </div>
      </div>

      <p class="candle-count font-digits">
        Сегодня на сайте побывало:
        <strong>{{ count }}</strong>
        {{ visitorsLabel }}
      </p>

      <button
        v-if="!isLit"
        class="btn btn-primary candle-btn"
        :disabled="loading"
        @click="handleLight"
      >
        {{ loading ? 'Зажигаем...' : 'Поставить свечу' }}
      </button>
      <p v-else class="candle-lit-msg">Ваша свеча уже горит. Спасибо за молитву.</p>

      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <div class="candle-note card">
      <h3>О традиции свечи</h3>
      <p>
        Свеча в православном храме — символ молитвы и жертвенности. Виртуальная свеча
        напоминает о живой связи верующих, объединённых общей молитвой, где бы они ни находились.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { getCandleStats, lightCandle } from '../api';
import { useCandleId } from '../composables/useCandleId';

const { candleClientId } = useCandleId();

const count = ref(0);
const isLit = ref(false);
const loading = ref(false);
const error = ref('');

const visitorsLabel = computed(() => {
  const n = count.value;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'человек';
  if (mod10 === 1) return 'человек';
  if (mod10 >= 2 && mod10 <= 4) return 'человека';
  return 'человек';
});

async function loadStats() {
  error.value = '';
  try {
    const data = await getCandleStats(candleClientId.value);
    count.value = data.count;
    isLit.value = data.hasLit;
  } catch (e) {
    error.value = e.message;
  }
}

async function handleLight() {
  loading.value = true;
  error.value = '';
  try {
    const data = await lightCandle(candleClientId.value);
    count.value = data.count;
    isLit.value = true;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

onMounted(loadStats);

watch(candleClientId, () => {
  isLit.value = false;
  loadStats();
});
</script>
