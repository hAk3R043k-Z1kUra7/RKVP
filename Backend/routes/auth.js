const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../supabaseClient');
const authMiddleware = require('../middleware/auth');
const { isSupabaseUnavailable, respondSupabaseError } = require('../utils/supabaseError');
const { withRole, USER_BASE_FIELDS, USER_FIELDS_WITH_ROLE, isMissingRoleColumn } = require('../utils/userRole');
const { insertUser, updateUser } = require('../utils/userDb');
const { getPasswordValidationError } = require('../utils/passwordValidation');

const router = express.Router();
const SALT_ROUNDS = 10;

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Поля email, password и name обязательны' });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Некорректный email' });
  }
  const passwordError = getPasswordValidationError(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }
  if (typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Имя должно содержать минимум 2 символа' });
  }

  try {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const { data: user, error } = await insertUser({
      email: email.toLowerCase(),
      password_hash: passwordHash,
      name: name.trim(),
    });

    if (error) throw error;

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user: withRole(user), token });
  } catch (err) {
    respondSupabaseError(res, err);
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Поля email и password обязательны' });
  }

  try {
    let result = await supabase
      .from('users')
      .select(`${USER_FIELDS_WITH_ROLE}, password_hash`)
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (result.error && isMissingRoleColumn(result.error)) {
      result = await supabase
        .from('users')
        .select(`${USER_BASE_FIELDS}, password_hash`)
        .eq('email', email.toLowerCase())
        .maybeSingle();
    }

    const { data: user, error } = result;

    if (error) {
      if (isSupabaseUnavailable(error)) return respondSupabaseError(res, error);
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const { password_hash, ...safeUser } = user;
    res.json({ user: withRole(safeUser), token });
  } catch (err) {
    respondSupabaseError(res, err);
  }
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

router.patch('/me', authMiddleware, async (req, res) => {
  const { name, password, currentPassword } = req.body;
  const updates = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Имя должно содержать минимум 2 символа' });
    }
    updates.name = name.trim();
  }

  if (password !== undefined) {
    const passwordError = getPasswordValidationError(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }
    if (!currentPassword) {
      return res.status(400).json({ error: 'Укажите текущий пароль' });
    }

    const { data: fullUser, error: fetchError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.user.id)
      .single();

    if (fetchError || !fullUser) {
      return res.status(500).json({ error: 'Ошибка сервера' });
    }

    const isMatch = await bcrypt.compare(currentPassword, fullUser.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Неверный текущий пароль' });
    }

    updates.password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  }

  if (!Object.keys(updates).length) {
    return res.status(400).json({ error: 'Нет данных для обновления' });
  }

  try {
    const { data: user, error } = await updateUser(req.user.id, updates);
    if (error) throw error;

    res.json({ user: withRole(user) });
  } catch (err) {
    respondSupabaseError(res, err);
  }
});

module.exports = router;
