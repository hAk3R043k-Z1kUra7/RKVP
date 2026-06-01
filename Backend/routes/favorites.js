const express = require('express');
const supabase = require('../supabaseClient');
const authMiddleware = require('../middleware/auth');
const { respondSupabaseError } = require('../utils/supabaseError');

const router = express.Router();

router.use(authMiddleware);

function mapFavoriteRow(row) {
  const product = row.products;
  if (!product) return null;
  return {
    favoriteId: row.id,
    addedAt: row.created_at,
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    category: product.category,
    image_url: product.image_url,
  };
}

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('id, created_at, products ( id, name, description, price, category, image_url )')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const items = (data ?? []).map(mapFavoriteRow).filter(Boolean);
    res.json({ items, productIds: items.map((i) => i.id) });
  } catch (err) {
    respondSupabaseError(res, err);
  }
});

router.get('/ids', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('product_id')
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({ productIds: (data ?? []).map((r) => r.product_id) });
  } catch (err) {
    respondSupabaseError(res, err);
  }
});

router.post('/:productId', async (req, res) => {
  const { productId } = req.params;

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
      .from('favorites')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('product_id', productId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from('favorites').delete().eq('id', existing.id);
      if (error) throw error;
      return res.json({ added: false, productId });
    }

    const { error } = await supabase.from('favorites').insert({
      user_id: req.user.id,
      product_id: productId,
    });

    if (error) throw error;

    res.status(201).json({ added: true, productId });
  } catch (err) {
    respondSupabaseError(res, err);
  }
});

router.delete('/:productId', async (req, res) => {
  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', req.user.id)
      .eq('product_id', req.params.productId);

    if (error) throw error;

    res.json({ removed: true, productId: req.params.productId });
  } catch (err) {
    respondSupabaseError(res, err);
  }
});

module.exports = router;
