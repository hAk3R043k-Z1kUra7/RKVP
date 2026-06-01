const express = require('express');
const supabase = require('../supabaseClient');
const { respondSupabaseError } = require('../utils/supabaseError');

const router = express.Router();

function parseDateParams(month, day) {
  const m = Number(month);
  const d = Number(day);
  if (!Number.isInteger(m) || m < 1 || m > 12) return null;
  if (!Number.isInteger(d) || d < 1 || d > 31) return null;
  return { month: m, day: d };
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

router.get('/', async (req, res) => {
  const now = new Date();
  const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;
  const day = req.query.day ? Number(req.query.day) : now.getDate();
  const gender = req.query.gender;

  const date = parseDateParams(month, day);
  if (!date) {
    return res.status(400).json({ error: 'Некорректная дата' });
  }

  try {
    let query = supabase
      .from('saint_names')
      .select('id, name, gender, month, day, saint_title, description')
      .eq('month', date.month)
      .eq('day', date.day)
      .order('name');

    if (gender === 'male' || gender === 'female') {
      query = query.eq('gender', gender);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ names: data ?? [], month: date.month, day: date.day });
  } catch (err) {
    respondSupabaseError(res, err);
  }
});

router.get('/random', async (req, res) => {
  const now = new Date();
  const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;
  const day = req.query.day ? Number(req.query.day) : now.getDate();
  const gender = req.query.gender;

  if (gender !== 'male' && gender !== 'female') {
    return res.status(400).json({ error: 'Укажите пол: male или female' });
  }

  const date = parseDateParams(month, day);
  if (!date) {
    return res.status(400).json({ error: 'Некорректная дата' });
  }

  try {
    const { data, error } = await supabase
      .from('saint_names')
      .select('id, name, gender, month, day, saint_title, description')
      .eq('month', date.month)
      .eq('day', date.day)
      .eq('gender', gender);

    if (error) throw error;

    if (!data?.length) {
      return res.status(404).json({
        error: 'Для этой даты нет имён выбранного пола. Попробуйте другую дату.',
      });
    }

    res.json({ name: pickRandom(data), month: date.month, day: date.day });
  } catch (err) {
    respondSupabaseError(res, err);
  }
});

module.exports = router;
