const { canManageProducts } = require('../utils/userRole');

function sellerMiddleware(req, res, next) {
  if (!req.user || !canManageProducts(req.user)) {
    return res.status(403).json({ error: 'Доступ только для продавцов и администраторов' });
  }
  next();
}

module.exports = sellerMiddleware;
