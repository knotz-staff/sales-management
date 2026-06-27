
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    await pool.query('ALTER TABLE customers ADD COLUMN phone VARCHAR(255)');
    console.log('Added phone column');
  } catch (e) {
    console.log('Phone column might already exist:', e.message);
  }
  
  try {
    await pool.query('ALTER TABLE customers ADD COLUMN email VARCHAR(255)');
    console.log('Added email column');
  } catch (e) {
    console.log('Email column might already exist:', e.message);
  }
  
  process.exit(0);
}

migrate();
