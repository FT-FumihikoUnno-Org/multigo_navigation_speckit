import { Pool } from 'pg';
import { DATABASE_URL } from './index';

const pool = new Pool({
  connectionString: DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = (text: string, params: any[] = []) => pool.query(text, params);
