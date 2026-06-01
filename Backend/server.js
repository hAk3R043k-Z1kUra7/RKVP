require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const adminRoutes = require('./routes/admin');
const candleRoutes = require('./routes/candles');
const nameRoutes = require('./routes/names');
const cartRoutes = require('./routes/cart');
const favoritesRoutes = require('./routes/favorites');
const ordersRoutes = require('./routes/orders');
const { checkSupabaseConnection } = require('./supabaseClient');
const { formatSupabaseError } = require('./utils/supabaseError');
const { ensureCartTable } = require('./utils/ensureCartTable');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await checkSupabaseConnection();
    res.json({ ok: true, database: 'connected' });
  } catch (err) {
    res.status(503).json({ ok: false, database: 'unavailable', error: formatSupabaseError(err) });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/candles', candleRoutes);
app.use('/api/names', nameRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/orders', ordersRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Святое Торжище API работает' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  try {
    await checkSupabaseConnection();
    console.log('✓ Supabase подключён');
  } catch (err) {
    console.warn('⚠ Supabase недоступен:', formatSupabaseError(err));
    console.warn('  → Откройте https://supabase.com/dashboard и восстановите проект');
  }
  await ensureCartTable();
});
