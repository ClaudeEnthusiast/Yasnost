const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  host: config.DB_HOST,
  port: config.DB_PORT,
  database: config.DB_NAME,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
});

async function loadKey(key) {
  const res = await pool.query('SELECT data FROM app_state WHERE key = $1', [key]);
  if (res.rows.length === 0) return [];
  return res.rows[0].data || [];
}

async function saveKey(key, data) {
  await pool.query(
    `INSERT INTO app_state (key, data, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (key) DO UPDATE SET data = $2::jsonb, updated_at = NOW()`,
    [key, JSON.stringify(data)]
  );
}

module.exports = { pool, loadKey, saveKey };
