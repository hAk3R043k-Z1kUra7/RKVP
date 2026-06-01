require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const MIGRATION_FILE = path.join(__dirname, '..', 'migration-cart.sql');

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ Задайте DATABASE_URL в Backend/.env');
    console.error('');
    console.error('Supabase Dashboard → Project Settings → Database → Connection string');
    console.error('(режим URI, пароль от базы данных, не service_role key)');
    console.error('');
    console.error('Пример:');
    console.error('DATABASE_URL=postgresql://postgres.[ref]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres');
    console.error('');
    console.error('Или выполните SQL вручную в SQL Editor:');
    console.error(fs.readFileSync(MIGRATION_FILE, 'utf8'));
    process.exit(1);
  }

  const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    await client.query(sql);
    console.log('✓ Таблица cart_items создана');
  } catch (err) {
    console.error('❌ Ошибка миграции:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
