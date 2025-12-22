import { query } from '../config/database';

export const up = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL
    );
  `);
  // Insert default roles
  await query(`INSERT INTO roles (name) VALUES ('Administrator') ON CONFLICT (name) DO NOTHING;`);
  await query(`INSERT INTO roles (name) VALUES ('Nurse') ON CONFLICT (name) DO NOTHING;`);
  await query(`INSERT INTO roles (name) VALUES ('Caregiver') ON CONFLICT (name) DO NOTHING;`);
};

export const down = async () => {
  await query(`
    DROP TABLE IF EXISTS roles;
  `);
};
