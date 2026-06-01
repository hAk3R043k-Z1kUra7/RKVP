const express = require('express');
const supabase = require('../supabaseClient');
const authMiddleware = require('../middleware/auth');
const sellerMiddleware = require('../middleware/seller');
const { respondSupabaseError } = require('../utils/supabaseError');

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

const SORT_COLUMNS = {
  name: 'name',
  price: 'price',
  created_at: 'created_at',
};

router.get('/', async (req, res) => {
  try {
    const usePagination =
      req.query.page !== undefined || req.query.limit !== undefined;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const sortBy = SORT_COLUMNS[req.query.sortBy] || 'created_at';
    const ascending = req.query.sortDir === 'asc';

    let query = supabase
      .from('products')
      .select('id, name, description, price, category, image_url, created_at', {
        count: usePagination ? 'exact' : undefined,
      })
      .order(sortBy, { ascending });

    if (req.query.category) {
      query = query.eq('category', req.query.category);
    }
    if (req.query.search) {
      query = query.ilike('name', `%${req.query.search}%`);
    }
    if (req.query.priceMin !== undefined && req.query.priceMin !== '') {
      const min = Number(req.query.priceMin);
      if (!Number.isNaN(min)) query = query.gte('price', min);
    }
    if (req.query.priceMax !== undefined && req.query.priceMax !== '') {
      const max = Number(req.query.priceMax);
      if (!Number.isNaN(max)) query = query.lte('price', max);
    }

    const { data, error, count } = usePagination
      ? await query.range(from, to)
      : await query;

    if (error) throw error;

    if (!usePagination) {
      return res.json({ products: data });
    }

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.json({
      products: data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (err) {
    respondSupabaseError(res, err);
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
    respondSupabaseError(res, err);
  }
});

// ─── POST /api/products  (защищённый) ────────────────────────────────────────

router.post('/', authMiddleware, sellerMiddleware, async (req, res) => {
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
    respondSupabaseError(res, err);
  }
});

// ─── PUT /api/products/:id  (защищённый) ─────────────────────────────────────

router.put('/:id', authMiddleware, sellerMiddleware, async (req, res) => {
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
    respondSupabaseError(res, err);
  }
});

// ─── DELETE /api/products/:id  (защищённый) ──────────────────────────────────

router.delete('/:id', authMiddleware, sellerMiddleware, async (req, res) => {
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
    respondSupabaseError(res, err);
  }
});

module.exports = router;
