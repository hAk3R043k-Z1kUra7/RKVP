const express = require('express');
const supabase = require('../supabaseClient');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { respondSupabaseError } = require('../utils/supabaseError');
const { ROLES, withRole, isMissingRoleColumn } = require('../utils/userRole');
const { selectUsersList } = require('../utils/userDb');

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/users', async (req, res) => {
  try {
    const { data, error } = await selectUsersList();
    if (error) throw error;

    res.json({ users: (data || []).map(withRole) });
  } catch (err) {
    respondSupabaseError(res, err);
  }
});

router.patch('/users/:id/role', async (req, res) => {
  const { role } = req.body;

  if (!ROLES.includes(role)) {
    return res.status(400).json({ error: 'Роль должна быть: user, seller или admin' });
  }

  if (req.params.id === req.user.id && role !== 'admin') {
    return res.status(400).json({ error: 'Нельзя понизить собственную роль администратора' });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', req.params.id)
      .select('id, email, name, role, created_at')
      .single();

    if (error) {
      if (isMissingRoleColumn(error)) {
        return res.status(503).json({
          error: 'Колонка role отсутствует в БД. Выполните migration-add-seller-role.sql в Supabase SQL Editor.',
        });
      }
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({ user: withRole(data) });
  } catch (err) {
    respondSupabaseError(res, err);
  }
});

module.exports = router;
