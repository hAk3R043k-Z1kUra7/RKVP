require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const MIGRATION_FILE = path.join(__dirname, '..', 'migration-cart.sql');

async function ensureCartTable() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return false;

  const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    await client.query(sql);
    console.log('✓ cart_items: таблица проверена/создана');
    return true;
  } catch (err) {
    console.warn('⚠ Не удалось создать cart_items:', err.message);
    return false;
  } finally {
    await client.end();
  }
}

module.exports = { ensureCartTable };
