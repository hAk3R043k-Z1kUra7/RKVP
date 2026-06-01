const crypto = require('crypto');
const supabase = require('../supabaseClient');

const TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function isMissingResetTable(error) {
  const msg = error?.message || '';
  return msg.includes('password_reset_tokens') && msg.includes('does not exist');
}

async function createPasswordResetToken(userId) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  await supabase.from('password_reset_tokens').delete().eq('user_id', userId);

  const { error } = await supabase.from('password_reset_tokens').insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (error) {
    if (isMissingResetTable(error)) {
      const err = new Error('Таблица password_reset_tokens не найдена. Выполните migration-password-reset.sql');
      err.code = 'MISSING_RESET_TABLE';
      throw err;
    }
    throw error;
  }

  return { rawToken, expiresAt };
}

async function findValidToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('password_reset_tokens')
    .select('id, user_id, expires_at')
    .eq('token_hash', tokenHash)
    .gt('expires_at', now)
    .maybeSingle();

  if (error) {
    if (isMissingResetTable(error)) {
      const err = new Error('Таблица password_reset_tokens не найдена. Выполните migration-password-reset.sql');
      err.code = 'MISSING_RESET_TABLE';
      throw err;
    }
    throw error;
  }

  return data;
}

async function deleteTokensForUser(userId) {
  await supabase.from('password_reset_tokens').delete().eq('user_id', userId);
}

module.exports = {
  createPasswordResetToken,
  findValidToken,
  deleteTokensForUser,
  isMissingResetTable,
};
