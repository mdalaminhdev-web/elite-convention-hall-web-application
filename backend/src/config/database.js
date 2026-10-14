import mysql from 'mysql2/promise';
import { env } from './env.js';

// A pool is instantiated only on first use; /health never requires a database.
let pool;
export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      waitForConnections: true,
      connectionLimit: env.DB_CONNECTION_LIMIT,
      queueLimit: 50,
      decimalNumbers: false,
      timezone: 'Z',
      namedPlaceholders: false,
    });
  }
  return pool;
}
export async function closePool() {
  if (pool) {
    const closing = pool;
    pool = undefined;
    await closing.end();
  }
}
