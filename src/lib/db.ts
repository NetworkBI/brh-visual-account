import pg from 'pg';

const { Pool } = pg;

// Get connection details from environment variables
const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  host: process.env.DATABASE_HOST || 'atlas_dw',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'br_hunter',
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: false,
});

// Helper for running queries
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    return res.rows;
  } catch (error) {
    console.error('Database query error:', error, { text });
    throw error;
  }
}
