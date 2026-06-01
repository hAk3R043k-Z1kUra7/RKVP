const { isAdmin } = require('../utils/userRole');

function adminMiddleware(req, res, next) {
  if (!req.user || !isAdmin(req.user)) {
    return res.status(403).json({ error: 'Доступ только для администратора' });
  }
  next();
}

module.exports = adminMiddleware;
