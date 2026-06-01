const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('❌ Задайте SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в Backend/.env');
  process.exit(1);
}

const supabase = createClient(url, key);

async function checkSupabaseConnection() {
  const { error } = await supabase.from('products').select('id').limit(1);
  if (error) throw error;
}

module.exports = supabase;
module.exports.checkSupabaseConnection = checkSupabaseConnection;
