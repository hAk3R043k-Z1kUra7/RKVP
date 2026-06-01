const ROLES = ['user', 'seller', 'admin'];

function parseEmailList(envKey) {
  return (process.env[envKey] || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function parseAdminEmails() {
  return parseEmailList('ADMIN_EMAILS');
}

function parseSellerEmails() {
  return parseEmailList('SELLER_EMAILS');
}

function resolveUserRole(user) {
  if (!user) return 'user';

  const email = user.email?.toLowerCase();
  if (user.role === 'admin' || (email && parseAdminEmails().includes(email))) return 'admin';
  if (user.role === 'seller' || (email && parseSellerEmails().includes(email))) return 'seller';

  return user.role || 'user';
}

function withRole(user) {
  if (!user) return user;
  return { ...user, role: resolveUserRole(user) };
}

function canManageProducts(user) {
  const role = resolveUserRole(user);
  return role === 'seller' || role === 'admin';
}

function isAdmin(user) {
  return resolveUserRole(user) === 'admin';
}

const USER_BASE_FIELDS = 'id, email, name, created_at';
const USER_FIELDS_WITH_ROLE = `${USER_BASE_FIELDS}, role`;

function isMissingRoleColumn(error) {
  const msg = error?.message || '';
  return msg.includes('column users.role') || msg.includes('column "role"');
}

module.exports = {
  ROLES,
  parseAdminEmails,
  parseSellerEmails,
  resolveUserRole,
  withRole,
  canManageProducts,
  isAdmin,
  USER_BASE_FIELDS,
  USER_FIELDS_WITH_ROLE,
  isMissingRoleColumn,
};
