const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../supabaseClient');
const authMiddleware = require('../middleware/auth');
const { isSupabaseUnavailable, respondSupabaseError } = require('../utils/supabaseError');
const { withRole, USER_BASE_FIELDS, USER_FIELDS_WITH_ROLE, isMissingRoleColumn } = require('../utils/userRole');
const { insertUser, updateUser } = require('../utils/userDb');
const { getPasswordValidationError } = require('../utils/passwordValidation');
const {
  getRecoveryKeywordValidationError,
  hashRecoveryKeyword,
  verifyRecoveryKeyword,
} = require('../utils/recoveryKeyword');
const {
  createPasswordResetToken,
  findValidToken,
  deleteTokensForUser,
} = require('../utils/passwordResetToken');
const { isMailConfigured, buildResetUrl, sendPasswordResetEmail } = require('../utils/mail');

const router = express.Router();
const SALT_ROUNDS = 10;

const GENERIC_RESET_MSG =
  'Если аккаунт с таким email существует, мы отправили инструкции для сброса пароля.';

function isMissingRecoveryColumn(error) {
  const msg = error?.message || '';
  return msg.includes('recovery_keyword_hash');
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post('/register', async (req, res) => {
  const { email, password, name, recoveryKeyword } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Поля email, password и name обязательны' });
  }
  const keywordError = getRecoveryKeywordValidationError(recoveryKeyword);
  if (keywordError) {
    return res.status(400).json({ error: keywordError });
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
    const recoveryKeywordHash = await hashRecoveryKeyword(recoveryKeyword);

    const insertPayload = {
      email: email.toLowerCase(),
      password_hash: passwordHash,
      name: name.trim(),
      recovery_keyword_hash: recoveryKeywordHash,
    };

    const { data: user, error } = await insertUser(insertPayload);

    if (error) {
      if (isMissingRecoveryColumn(error)) {
        return res.status(503).json({
          error: 'Выполните migration-password-reset.sql в Supabase для регистрации с ключевым словом.',
        });
      }
      throw error;
    }

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

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email || !validateEmail(email)) {
    return res.status(400).json({ error: 'Укажите корректный email' });
  }

  const normalizedEmail = email.toLowerCase();

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error && !isSupabaseUnavailable(error)) {
      return res.json({ message: GENERIC_RESET_MSG });
    }

    if (user) {
      const { rawToken } = await createPasswordResetToken(user.id);
      const resetUrl = buildResetUrl(rawToken);

      if (isMailConfigured()) {
        await sendPasswordResetEmail(user.email, resetUrl);
        return res.json({ message: GENERIC_RESET_MSG });
      }

      console.log('[password-reset] SMTP не настроен. Ссылка для', user.email, ':', resetUrl);

      const payload = {
        message:
          'Почта не настроена на сервере. Используйте сброс по ключевому слову или настройте SMTP (см. Backend/.env.example).',
      };

      if (process.env.NODE_ENV !== 'production' || process.env.RESET_LINK_IN_RESPONSE === 'true') {
        payload.devResetLink = resetUrl;
      }

      return res.json(payload);
    }

    return res.json({ message: GENERIC_RESET_MSG });
  } catch (err) {
    if (err.code === 'MISSING_RESET_TABLE') {
      return res.status(503).json({ error: err.message });
    }
    respondSupabaseError(res, err);
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, email, recoveryKeyword, newPassword } = req.body;

  const passwordError = getPasswordValidationError(newPassword);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  try {
    if (token) {
      const row = await findValidToken(token);
      if (!row) {
        return res.status(400).json({ error: 'Ссылка недействительна или истекла. Запросите сброс снова.' });
      }

      const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('id', row.user_id);

      if (updateError) throw updateError;

      await deleteTokensForUser(row.user_id);
      return res.json({ message: 'Пароль обновлён. Теперь можно войти.' });
    }

    if (!email || !recoveryKeyword) {
      return res.status(400).json({ error: 'Укажите email, ключевое слово и новый пароль' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Некорректный email' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, recovery_keyword_hash')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) {
      if (isMissingRecoveryColumn(error)) {
        return res.status(503).json({
          error: 'Сброс по ключевому слову недоступен. Выполните migration-password-reset.sql в Supabase.',
        });
      }
      throw error;
    }

    if (!user) {
      return res.status(400).json({ error: 'Неверный email или ключевое слово' });
    }
    if (!user.recovery_keyword_hash) {
      return res.status(400).json({
        error: 'Ключевое слово не задано. Войдите в аккаунт и укажите его в профиле.',
      });
    }

    const keywordOk = await verifyRecoveryKeyword(recoveryKeyword, user.recovery_keyword_hash);
    if (!keywordOk) {
      return res.status(400).json({ error: 'Неверный email или ключевое слово' });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', user.id);

    if (updateError) throw updateError;

    await deleteTokensForUser(user.id);
    return res.json({ message: 'Пароль обновлён. Теперь можно войти.' });
  } catch (err) {
    if (err.code === 'MISSING_RESET_TABLE') {
      return res.status(503).json({ error: err.message });
    }
    respondSupabaseError(res, err);
  }
});

router.patch('/me', authMiddleware, async (req, res) => {
  const { name, password, currentPassword, recoveryKeyword } = req.body;
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

  if (recoveryKeyword !== undefined) {
    const keywordError = getRecoveryKeywordValidationError(recoveryKeyword);
    if (keywordError) {
      return res.status(400).json({ error: keywordError });
    }
    if (!currentPassword) {
      return res.status(400).json({ error: 'Укажите текущий пароль для смены ключевого слова' });
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

    updates.recovery_keyword_hash = await hashRecoveryKeyword(recoveryKeyword);
  }

  if (!Object.keys(updates).length) {
    return res.status(400).json({ error: 'Нет данных для обновления' });
  }

  try {
    let { data: user, error } = await updateUser(req.user.id, updates);

    if (error && updates.recovery_keyword_hash && isMissingRecoveryColumn(error)) {
      const { recovery_keyword_hash, ...rest } = updates;
      if (!Object.keys(rest).length) {
        return res.status(503).json({
          error: 'Колонка recovery_keyword_hash не найдена. Выполните migration-password-reset.sql.',
        });
      }
      ({ data: user, error } = await updateUser(req.user.id, rest));
    }

    if (error) throw error;

    res.json({ user: withRole(user) });
  } catch (err) {
    respondSupabaseError(res, err);
  }
});

module.exports = router;
