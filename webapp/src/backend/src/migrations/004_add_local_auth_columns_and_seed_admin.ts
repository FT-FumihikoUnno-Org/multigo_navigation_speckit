import { query } from '../config/database';
import crypto from 'crypto';

export const up = async () => {
  // Add local auth columns
  await query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS password_hash TEXT,
      ADD COLUMN IF NOT EXISTS local BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN NOT NULL DEFAULT FALSE;
  `);

  // Optionally seed an initial admin user when environment variables are provided.
  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const adminPasswordHash = process.env.BOOTSTRAP_ADMIN_PASSWORD_HASH;
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!adminEmail) {
    console.log('No BOOTSTRAP_ADMIN_EMAIL provided; skipping initial admin seed.');
    return;
  }

  // Check if user already exists
  const existing = await query('SELECT id FROM users WHERE email = $1', [adminEmail]);
  if (existing.rows.length > 0) {
    console.log(`User with email ${adminEmail} already exists; skipping seed.`);
    return;
  }

  // Determine password hash: prefer explicit hash, otherwise derive using scrypt
  let passwordHashToStore: string | null = null;
  if (adminPasswordHash && adminPasswordHash.length > 0) {
    passwordHashToStore = adminPasswordHash;
  } else if (adminPassword && adminPassword.length > 0) {
    // Derive a scrypt-based hash and store as salt$hash (both base64)
    const salt = crypto.randomBytes(16).toString('base64');
    const derived = crypto.scryptSync(adminPassword, salt, 64).toString('base64');
    passwordHashToStore = `${salt}$${derived}`;
    console.log('Derived scrypt password hash for BOOTSTRAP_ADMIN_PASSWORD.');
  } else {
    console.log('No password or password-hash provided; creating admin without local password (local=false).');
  }

  // Resolve Administrator role id
  const { rows: roleRows } = await query('SELECT id FROM roles WHERE name = $1', ['Administrator']);
  const roleId = roleRows.length > 0 ? roleRows[0].id : null;

  // Use an internal oidc_id prefix for local users
  const oidcId = `local:${adminEmail}`;

  await query(
    `INSERT INTO users (oidc_id, email, display_name, role_id, password_hash, local, force_password_change)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (email) DO NOTHING;`,
    [oidcId, adminEmail, 'Administrator', roleId, passwordHashToStore, passwordHashToStore ? true : false, passwordHashToStore ? true : false]
  );

  console.log(`Seeded initial admin (email=${adminEmail}, local=${passwordHashToStore ? 'true' : 'false'})`);
};

export const down = async () => {
  // If BOOTSTRAP_ADMIN_EMAIL was used to create a seeded admin, remove it
  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL;
  if (adminEmail) {
    await query('DELETE FROM users WHERE email = $1 AND oidc_id LIKE $2', [adminEmail, 'local:%']);
    console.log(`Removed seeded admin with email ${adminEmail}`);
  }

  await query(`
    ALTER TABLE users
      DROP COLUMN IF EXISTS password_hash,
      DROP COLUMN IF EXISTS local,
      DROP COLUMN IF EXISTS force_password_change;
  `);
};
