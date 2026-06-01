<template>
  <div class="admin-form">
    <h2 class="page-title">{{ isEdit ? 'Редактировать товар' : 'Добавить товар' }}</h2>

    <div class="card">
      <form @submit.prevent="submit">
        <div class="form-group">
          <label for="name">Название *</label>
          <input id="name" v-model="form.name" type="text" required minlength="2" />
        </div>
        <div class="form-group">
          <label for="description">Описание</label>
          <textarea id="description" v-model="form.description" rows="4" />
        </div>
        <div class="form-group">
          <label for="price">Цена (₽) *</label>
          <input id="price" v-model.number="form.price" type="number" min="0" step="0.01" required />
        </div>
        <div class="form-group">
          <label for="category">Категория *</label>
          <select id="category" v-model="form.category" required>
            <option value="" disabled>Выберите категорию</option>
            <option v-for="cat in PRODUCT_CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>
        <div class="form-group">
          <label for="localImage">Изображение из папки assets</label>
          <select id="localImage" v-model="form.localImage">
            <option value="">Авто по названию / категории</option>
            <option v-for="img in LOCAL_PRODUCT_IMAGES" :key="img.value" :value="img.value">
              {{ img.label }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label for="image_url">Или внешняя ссылка</label>
          <input id="image_url" v-model="form.image_url" type="url" placeholder="https://..." />
        </div>
        <div v-if="previewImage" class="form-group">
          <img :src="previewImage" alt="Превью" style="max-height: 160px" />
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Добавить' }}
          </button>
          <router-link to="/dashboard/products" class="btn btn-outline">Отмена</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { PRODUCT_CATEGORIES } from '../constants/categories';
import { getProduct, createProduct, updateProduct } from '../api';
import {
  LOCAL_PRODUCT_IMAGES,
  resolveLocalImagePath,
  toStoredImageValue,
  getProductImage,
} from '../utils/productImages';

const route = useRoute();
const router = useRouter();
const isEdit = computed(() => !!route.params.id);
const saving = ref(false);
const error = ref('');

const form = ref({
  name: '',
  description: '',
  price: 0,
  category: '',
  localImage: '',
  image_url: '',
});

const previewImage = computed(() => {
  if (form.value.image_url) return form.value.image_url;
  if (form.value.localImage) return resolveLocalImagePath(form.value.localImage);
  return getProductImage({
    name: form.value.name,
    category: form.value.category,
  });
});

onMounted(async () => {
  if (!isEdit.value) return;
  try {
    const res = await getProduct(route.params.id);
    const p = res.product;
    form.value = {
      name: p.name,
      description: p.description || '',
      price: Number(p.price),
      category: p.category,
      localImage: p.image_url?.startsWith('local:') ? p.image_url.slice(6) : '',
      image_url: p.image_url && !p.image_url.startsWith('local:') ? p.image_url : '',
    };
  } catch (e) {
    error.value = e.message;
  }
});

async function submit() {
  saving.value = true;
  error.value = '';

  let image_url = null;
  if (form.value.image_url.trim()) {
    image_url = form.value.image_url.trim();
  } else if (form.value.localImage) {
    image_url = toStoredImageValue(form.value.localImage);
  }

  const body = {
    name: form.value.name.trim(),
    description: form.value.description.trim() || null,
    price: form.value.price,
    category: form.value.category,
    image_url,
  };

  try {
    if (isEdit.value) {
      await updateProduct(route.params.id, body);
    } else {
      await createProduct(body);
    }
    router.push('/dashboard/products');
  } catch (e) {
    error.value = e.message;
  } finally {
    saving.value = false;
  }
}
</script>
