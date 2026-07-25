import pg from 'pg';

const { Pool } = pg;

// Get connection details from environment variables
const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString,
  // If connectionString is not provided, pg will automatically fall back to:
  // PGUSER, PGHOST, PGPASSWORD, PGDATABASE, PGPORT
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
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
