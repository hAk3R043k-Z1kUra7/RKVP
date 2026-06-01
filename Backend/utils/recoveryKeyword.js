const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;
const MIN_LENGTH = 4;

function normalizeRecoveryKeyword(keyword) {
  return typeof keyword === 'string' ? keyword.trim().toLowerCase() : '';
}

function getRecoveryKeywordValidationError(keyword) {
  const normalized = normalizeRecoveryKeyword(keyword);
  if (!normalized) {
    return 'Укажите ключевое слово для восстановления пароля';
  }
  if (normalized.length < MIN_LENGTH) {
    return `Ключевое слово — минимум ${MIN_LENGTH} символа`;
  }
  return null;
}

async function hashRecoveryKeyword(keyword) {
  return bcrypt.hash(normalizeRecoveryKeyword(keyword), SALT_ROUNDS);
}

async function verifyRecoveryKeyword(keyword, hash) {
  if (!hash) return false;
  return bcrypt.compare(normalizeRecoveryKeyword(keyword), hash);
}

module.exports = {
  normalizeRecoveryKeyword,
  getRecoveryKeywordValidationError,
  hashRecoveryKeyword,
  verifyRecoveryKeyword,
};
