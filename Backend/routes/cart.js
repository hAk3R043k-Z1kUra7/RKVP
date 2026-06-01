const express = require('express');
const supabase = require('../supabaseClient');
const authMiddleware = require('../middleware/auth');
const { respondSupabaseError } = require('../utils/supabaseError');

const router = express.Router();

function mapCartRow(row) {
  const product = row.products;
  if (!product) return null;
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    category: product.category,
    image_url: product.image_url,
    quantity: row.quantity,
  };
}

async function fetchCartItems(userId) {
  const { data, error } = await supabase
    .from('cart_items')
    .select('quantity, products ( id, name, description, price, category, image_url )')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapCartRow).filter(Boolean);
}

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const items = await fetchCartItems(req.user.id);
    res.json({ items });
  } catch (err) {
    respondSupabaseError(res, err);
  }
});

router.post('/items', async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const qty = Number(quantity);

  if (!productId) {
    return res.status(400).json({ error: 'Укажите productId' });
  }
  if (!Number.isInteger(qty) || qty < 1) {
    return res.status(400).json({ error: 'Количество должно быть не меньше 1' });
  }

  try {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .maybeSingle();

    if (productError) throw productError;
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', req.user.id)
      .eq('product_id', productId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + qty, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase.from('cart_items').insert({
        user_id: req.user.id,
        product_id: productId,
        quantity: qty,
      });

      if (error) throw error;
    }

    const items = await fetchCartItems(req.user.id);
    res.json({ items });
  } catch (err) {
    respondSupabaseError(res, err);
  }
});

router.patch('/items/:productId', async (req, res) => {
  const { productId } = req.params;
  const qty = Number(req.body.quantity);

  if (!Number.isInteger(qty) || qty < 1) {
    return res.status(400).json({ error: 'Количество должно быть не меньше 1' });
  }

  try {
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: qty, updated_at: new Date().toISOString() })
      .eq('user_id', req.user.id)
      .eq('product_id', productId)
      .select('id');

    if (error) throw error;
    if (!data?.length) {
      return res.status(404).json({ error: 'Позиция не найдена в корзине' });
    }

    const items = await fetchCartItems(req.user.id);
    res.json({ items });
  } catch (err) {
    respondSupabaseError(res, err);
  }
});

router.delete('/items/:productId', async (req, res) => {
  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', req.user.id)
      .eq('product_id', req.params.productId);

    if (error) throw error;

    const items = await fetchCartItems(req.user.id);
    res.json({ items });
  } catch (err) {
    respondSupabaseError(res, err);
  }
});

router.delete('/', async (req, res) => {
  try {
    const { error } = await supabase.from('cart_items').delete().eq('user_id', req.user.id);

    if (error) throw error;

    res.json({ items: [] });
  } catch (err) {
    respondSupabaseError(res, err);
  }
});

module.exports = router;
