const productImages = import.meta.glob('../assets/images/products/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
});

const imageByFile = Object.fromEntries(
  Object.entries(productImages).map(([path, url]) => {
    const file = path.split('/').pop();
    return [file, url];
  }),
);

export const LOCAL_PRODUCT_IMAGES = Object.keys(imageByFile).map((file) => ({
  label: file.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '),
  value: file,
  url: imageByFile[file],
}));

/** Соответствие названия товара → файл изображения */
const NAME_TO_FILE = [
  { pattern: /спасител/i, file: 'ikony-spasitelya.jpg' },
  { pattern: /казанск|богород|матер/i, file: 'mater_bojia.jpg' },
  { pattern: /крест/i, file: 'krest.jpg' },
  { pattern: /масло|лампад/i, file: 'maslo_lampadnoe_0_5_l_3_1598.jpg' },
  { pattern: /свеч/i, file: 'svechi.jpg' },
  { pattern: /чётк|четк/i, file: 'chetki.jpg' },
];

const CATEGORY_TO_FILE = {
  Иконы: 'ikony-spasitelya.jpg',
  Украшения: 'krest.jpg',
  'Свечи и масла': 'svechi.jpg',
  Аксессуары: 'chetki.jpg',
  Книги: 'mater_bojia.jpg',
};

export function resolveLocalImagePath(imageKey) {
  if (!imageKey) return null;
  if (imageByFile[imageKey]) return imageByFile[imageKey];
  const key = imageKey.toLowerCase();
  const found = Object.keys(imageByFile).find((file) => file.toLowerCase().includes(key));
  return found ? imageByFile[found] : null;
}

export function getProductImage(product) {
  if (product?.image_url?.startsWith('local:')) {
    const local = resolveLocalImagePath(product.image_url.slice(6));
    if (local) return local;
  }

  if (product?.image_url && !product.image_url.startsWith('local:')) {
    return product.image_url;
  }

  const name = product?.name || '';
  for (const rule of NAME_TO_FILE) {
    if (rule.pattern.test(name) && imageByFile[rule.file]) {
      return imageByFile[rule.file];
    }
  }

  const categoryFile = CATEGORY_TO_FILE[product?.category];
  if (categoryFile && imageByFile[categoryFile]) {
    return imageByFile[categoryFile];
  }

  return LOCAL_PRODUCT_IMAGES[0]?.url || null;
}

export function toStoredImageValue(selected) {
  if (!selected) return null;
  if (selected.startsWith('http://') || selected.startsWith('https://')) return selected;
  return `local:${selected}`;
}

export function defaultImageForProductName(name) {
  for (const rule of NAME_TO_FILE) {
    if (rule.pattern.test(name)) return `local:${rule.file}`;
  }
  return null;
}

export function getCartItemImage(item) {
  return getProductImage({
    name: item?.name,
    category: item?.category,
    image_url: item?.image_url || item?.image,
  });
}
