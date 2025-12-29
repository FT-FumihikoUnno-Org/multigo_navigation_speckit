import { query } from '../config/database';

export const up = async () => {
  await query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT FALSE;
  `);
};

export const down = async () => {
  await query(`
    ALTER TABLE users
    DROP COLUMN IF EXISTS approved;
  `);
};
