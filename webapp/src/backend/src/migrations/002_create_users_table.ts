import { query } from '../config/database';

export const up = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      oidc_id VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      display_name VARCHAR(255),
      role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL
    );
  `);
};

export const down = async () => {
  await query(`
    DROP TABLE IF EXISTS users;
  `);
};
