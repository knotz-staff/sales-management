import { Pool } from 'pg';

// Fallback to a dummy connection string during build time if not provided
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || 'postgres://user:password@localhost:5432/mydb',
  ssl: process.env.POSTGRES_URL ? {
    rejectUnauthorized: false
  } : false
});

let isInitialized = false;

export async function getDb() {
  if (!isInitialized && process.env.POSTGRES_URL) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS customers (
          id SERIAL PRIMARY KEY,
          company_name VARCHAR(255) NOT NULL,
          contact_name VARCHAR(255) NOT NULL,
          manager_name VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL CHECK(status IN ('new', 'existing', 'prospective')),
          last_contact_date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS meetings (
          id SERIAL PRIMARY KEY,
          customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
          meeting_date DATE NOT NULL,
          details TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      isInitialized = true;
    } catch (error) {
      console.error('Database initialization failed:', error);
    }
  }
  return pool;
}

export default pool;
