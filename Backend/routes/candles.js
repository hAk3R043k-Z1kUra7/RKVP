const express = require('express');
const supabase = require('../supabaseClient');
const { respondSupabaseError } = require('../utils/supabaseError');

const router = express.Router();

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

router.get('/', async (req, res) => {
  const visitorId = req.query.visitorId;
  const today = todayDateString();

  try {
    const { count, error } = await supabase
      .from('candle_lights')
      .select('*', { count: 'exact', head: true })
      .eq('lit_date', today);

    if (error) throw error;

    let hasLit = false;
    if (visitorId) {
      const { data } = await supabase
        .from('candle_lights')
        .select('id')
        .eq('visitor_id', visitorId)
        .eq('lit_date', today)
        .maybeSingle();
      hasLit = !!data;
    }

    res.json({ count: count ?? 0, hasLit, date: today });
  } catch (err) {
    respondSupabaseError(res, err);
  }
});

router.post('/light', async (req, res) => {
  const { visitorId } = req.body;

  if (!visitorId || typeof visitorId !== 'string' || visitorId.length < 8) {
    return res.status(400).json({ error: 'Некорректный идентификатор посетителя' });
  }

  const today = todayDateString();

  try {
    const { data: existing } = await supabase
      .from('candle_lights')
      .select('id')
      .eq('visitor_id', visitorId)
      .eq('lit_date', today)
      .maybeSingle();

    if (!existing) {
      const { error: insertError } = await supabase
        .from('candle_lights')
        .insert({ visitor_id: visitorId, lit_date: today });

      if (insertError) throw insertError;
    }

    const { count, error } = await supabase
      .from('candle_lights')
      .select('*', { count: 'exact', head: true })
      .eq('lit_date', today);

    if (error) throw error;

    res.json({ count: count ?? 0, hasLit: true, date: today });
  } catch (err) {
    respondSupabaseError(res, err);
  }
});

module.exports = router;
