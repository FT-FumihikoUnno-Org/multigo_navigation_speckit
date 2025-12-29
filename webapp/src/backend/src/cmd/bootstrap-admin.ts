#!/usr/bin/env ts-node
import readline from 'readline';
import { hashPasswordScrypt } from '../services/localAuth';
import { query } from '../config/database';

async function prompt(queryText: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(queryText, (ans) => { rl.close(); resolve(ans); }));
}

export async function runBootstrapAdmin(opts: { email?: string; password?: string; approve?: boolean } = {}) {
  const parsedEmail = opts.email || process.env.BOOTSTRAP_ADMIN_EMAIL;
  const parsedPassword = opts.password || process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const approve = !!opts.approve;

  const email = parsedEmail || await prompt('Admin email: ');
  const password = parsedPassword || await prompt('Admin password: ');

  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  // Ensure Administrator role exists
  let { rows } = await query('SELECT id FROM roles WHERE name = $1', ['Administrator']);
  let roleId = rows[0]?.id;
  if (!roleId) {
    const res = await query('INSERT INTO roles (name) VALUES ($1) RETURNING id', ['Administrator']);
    roleId = res.rows[0].id;
    console.log('Created Administrator role (id=', roleId, ')');
  }

  const passwordHash = hashPasswordScrypt(password);
  const oidcId = `local:${email}`;

  const insert = await query(
    `INSERT INTO users (oidc_id, email, display_name, password_hash, local, force_password_change, approved, role_id)
     VALUES ($1, $2, $3, $4, TRUE, TRUE, $5, $6) RETURNING id`,
    [oidcId, email, email, passwordHash, approve, roleId]
  );

  const userId = insert.rows[0].id;
  console.log(`Created admin user id=${userId}, email=${email}, approved=${approve}`);
  console.log('Note: You can approve or change the user role via the admin UI or API.');
  return { userId, roleId, approved: approve };
}

// CLI entrypoint
if (require.main === module) {
  (async () => {
    const args = process.argv.slice(2);
    const parsed: Record<string, string> = {};
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a.startsWith('--')) {
        const key = a.replace(/^--/, '');
        const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : 'true';
        parsed[key] = val;
        if (val !== 'true') i++;
      }
    }
    try {
      await runBootstrapAdmin({ email: parsed.email, password: parsed.password, approve: parsed.approve === 'true' || parsed.approve === '1' });
      process.exit(0);
    } catch (e: any) {
      console.error('Error bootstrapping admin:', e && e.stack ? e.stack : e);
      process.exit(2);
    }
  })();
}
