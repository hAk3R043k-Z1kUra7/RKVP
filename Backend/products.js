const express = require('express');
const supabase = require('../supabaseClient');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ─── Валидация ────────────────────────────────────────────────────────────────

function validateProduct({ name, price, category }) {
  const errors = [];
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Название товара обязательно (минимум 2 символа)');
  }
  if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
    errors.push('Цена должна быть неотрицательным числом');
  }
  if (!category || typeof category !== 'string' || category.trim().length < 2) {
    errors.push('Категория обязательна');
  }
  return errors;
}

// ─── GET /api/products  (публичный) ──────────────────────────────────────────
// Поддерживает ?category=иконы и ?search=текст

router.get('/', async (req, res) => {
  try {
    let query = supabase
      .from('products')
      .select('id, name, description, price, category, image_url, created_at')
      .order('created_at', { ascending: false });

    if (req.query.category) {
      query = query.eq('category', req.query.category);
    }
    if (req.query.search) {
      query = query.ilike('name', `%${req.query.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ products: data });
  } catch (err) {
    console.error('GET /products error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── GET /api/products/:id  (публичный) ──────────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    res.json({ product: data });
  } catch (err) {
    console.error('GET /products/:id error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── POST /api/products  (защищённый) ────────────────────────────────────────

router.post('/', authMiddleware, async (req, res) => {
  const { name, description, price, category, image_url } = req.body;

  const errors = validateProduct({ name, price, category });
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        price: Number(price),
        category: category.trim(),
        image_url: image_url || null,
        created_by: req.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ product: data });
  } catch (err) {
    console.error('POST /products error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── PUT /api/products/:id  (защищённый) ─────────────────────────────────────

router.put('/:id', authMiddleware, async (req, res) => {
  const { name, description, price, category, image_url } = req.body;

  const errors = validateProduct({ name, price, category });
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  try {
    // Проверяем, что товар существует
    const { data: existing, error: findError } = await supabase
      .from('products')
      .select('id, created_by')
      .eq('id', req.params.id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    const { data, error } = await supabase
      .from('products')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        price: Number(price),
        category: category.trim(),
        image_url: image_url || null,
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ product: data });
  } catch (err) {
    console.error('PUT /products/:id error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── DELETE /api/products/:id  (защищённый) ──────────────────────────────────

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { data: existing, error: findError } = await supabase
      .from('products')
      .select('id')
      .eq('id', req.params.id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Товар удалён' });
  } catch (err) {
    console.error('DELETE /products/:id error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
