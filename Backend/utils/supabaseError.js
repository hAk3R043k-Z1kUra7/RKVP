function isSupabaseUnavailable(err) {
  const msg = err?.message || String(err);
  return (
    msg.includes('<!DOCTYPE html>') ||
    msg.includes('521') ||
    msg.includes('Web server is down') ||
    msg.includes('fetch failed') ||
    msg.includes('ENOTFOUND') ||
    msg.includes('ECONNREFUSED') ||
    err?.code === 'ECONNREFUSED'
  );
}

function formatSupabaseError(err) {
  const msg = err?.message || String(err);

  if (msg.includes('column users.role does not exist')) {
    return 'В базе нет колонки role — регистрация уже должна работать. Для админ-доступа добавьте свой email в ADMIN_EMAILS в Backend/.env';
  }

  if (isSupabaseUnavailable(err)) {
    return 'База данных Supabase недоступна. Откройте dashboard.supabase.com, выберите проект и нажмите «Restore project», если он приостановлен.';
  }

  if (msg.includes('<!DOCTYPE html>')) {
    return 'База данных Supabase недоступна. Проверьте проект в панели Supabase.';
  }

  return msg.replace(/^Supabase:\s*/i, '');
}

function logSupabaseError(label, err) {
  if (isSupabaseUnavailable(err)) {
    console.error(`${label}: Supabase недоступен (проект приостановлен или сервер не отвечает)`);
    return;
  }
  console.error(`${label}:`, err?.message || err);
}

function respondSupabaseError(res, err) {
  const unavailable = isSupabaseUnavailable(err);
  logSupabaseError('Supabase', err);
  res.status(unavailable ? 503 : 500).json({ error: formatSupabaseError(err) });
}

module.exports = {
  isSupabaseUnavailable,
  formatSupabaseError,
  logSupabaseError,
  respondSupabaseError,
};
