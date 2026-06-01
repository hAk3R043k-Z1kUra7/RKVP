const express = require('express');
const supabase = require('../supabaseClient');
const authMiddleware = require('../middleware/auth');
const { respondSupabaseError } = require('../utils/supabaseError');

const router = express.Router();

router.use(authMiddleware);

async function fetchCartItems(userId) {
  const { data, error } = await supabase
    .from('cart_items')
    .select('quantity, products ( id, name, price )')
    .eq('user_id', userId);

  if (error) throw error;
  return (data ?? [])
    .filter((row) => row.products)
    .map((row) => ({
      productId: row.products.id,
      name: row.products.name,
      price: Number(row.products.price),
      quantity: row.quantity,
    }));
}

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id, total, status, created_at, order_items ( id, product_name, price, quantity )')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const orders = (data ?? []).map((o) => ({
      id: o.id,
      total: Number(o.total),
      status: o.status,
      createdAt: o.created_at,
      items: (o.order_items ?? []).map((i) => ({
        id: i.id,
        productName: i.product_name,
        price: Number(i.price),
        quantity: i.quantity,
      })),
    }));

    res.json({ orders });
  } catch (err) {
    respondSupabaseError(res, err);
  }
});

router.post('/', async (req, res) => {
  try {
    const cartItems = await fetchCartItems(req.user.id);

    if (!cartItems.length) {
      return res.status(400).json({ error: 'Корзина пуста' });
    }

    const total = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: req.user.id,
        total,
        status: 'new',
      })
      .select('id, total, status, created_at')
      .single();

    if (orderError) throw orderError;

    const orderItems = cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) throw itemsError;

    const { error: clearError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', req.user.id);

    if (clearError) throw clearError;

    res.status(201).json({
      order: {
        id: order.id,
        total: Number(order.total),
        status: order.status,
        createdAt: order.created_at,
        items: orderItems.map((i) => ({
          productName: i.product_name,
          price: i.price,
          quantity: i.quantity,
        })),
      },
    });
  } catch (err) {
    respondSupabaseError(res, err);
  }
});

module.exports = router;
