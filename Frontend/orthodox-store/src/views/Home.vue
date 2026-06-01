<template>

  <div class="home">

    <section class="hero">

      <h1>Святое Торжище</h1>

      <p>Иконы, книги, крестики и церковная утварь. Всё для духовной жизни.</p>

      <router-link to="/products" class="btn btn-primary">Перейти в каталог</router-link>

      <p v-if="statsLoading" class="hero-stats loading-inline">Загрузка статистики...</p>

      <p v-else-if="statsError" class="hero-stats error">{{ statsError }}</p>

      <p v-else-if="visitorCount != null" class="hero-stats font-digits">

        Сегодня на сайте побывало <strong>{{ visitorCount }}</strong> {{ visitorsLabel }}

      </p>

    </section>



    <section class="features">

      <div class="feature">

        <h3>Освящённые товары</h3>

        <p v-if="productCount != null" class="font-digits">

          В каталоге {{ productCount }} {{ productsLabel }} — выбирайте с доставкой по России

        </p>

        <p v-else>Работаем только с проверенными мастерскими и издательствами</p>

      </div>

      <div class="feature">

        <h3>Бережная доставка</h3>

        <p>Надёжная упаковка и отправка по всей России</p>

      </div>

      <div class="feature">

        <h3>Личный кабинет</h3>

        <p>История заказов, избранное и быстрое оформление</p>

      </div>

      <router-link to="/prayers" class="feature feature-link">

        <h3>Молитвы</h3>

        <p>Отче наш, Иисусова молитва, Символ веры и другие тексты для молитвы</p>

      </router-link>

      <router-link to="/candle" class="feature feature-link">

        <h3>Свеча онлайн</h3>

        <p>Зажгите виртуальную свечу и узнайте, сколько людей сегодня посетили сайт</p>

      </router-link>

      <router-link to="/name-generator" class="feature feature-link">

        <h3>Имена для крещения</h3>

        <p>Генератор поможет выбрать имя святого по православному календарю</p>

      </router-link>

    </section>

  </div>

</template>



<script setup>

import { ref, computed, onMounted } from 'vue';

import { getCandleStats, getProducts } from '../api';



const visitorCount = ref(null);

const productCount = ref(null);

const statsLoading = ref(true);

const statsError = ref('');



const visitorsLabel = computed(() => {

  const n = visitorCount.value ?? 0;

  const mod10 = n % 10;

  const mod100 = n % 100;

  if (mod100 >= 11 && mod100 <= 14) return 'человек';

  if (mod10 === 1) return 'человек';

  if (mod10 >= 2 && mod10 <= 4) return 'человека';

  return 'человек';

});



const productsLabel = computed(() => {

  const n = productCount.value ?? 0;

  const mod10 = n % 10;

  const mod100 = n % 100;

  if (mod100 >= 11 && mod100 <= 14) return 'товаров';

  if (mod10 === 1) return 'товар';

  if (mod10 >= 2 && mod10 <= 4) return 'товара';

  return 'товаров';

});



onMounted(async () => {

  statsLoading.value = true;

  statsError.value = '';

  try {

    const [candles, catalog] = await Promise.all([

      getCandleStats(),

      getProducts({ limit: 1, page: 1 }),

    ]);

    visitorCount.value = candles.count;

    productCount.value = catalog.pagination?.total ?? catalog.products?.length ?? 0;

  } catch (e) {

    statsError.value = e.message;

  } finally {

    statsLoading.value = false;

  }

});

</script>


