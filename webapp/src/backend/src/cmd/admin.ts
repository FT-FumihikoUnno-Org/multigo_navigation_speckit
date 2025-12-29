#!/usr/bin/env ts-node
import { query } from '../config/database';

export async function listPending() {
  const { rows } = await query(
    `SELECT u.id, u.email, u.display_name, r.name AS role FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE approved = false ORDER BY u.id`,
    []
  );
  return rows;
}

export async function approveUser(identifier: { id?: number; email?: string }) {
  if (!identifier.id && !identifier.email) throw new Error('id or email required');
  const where = identifier.id ? 'id = $1' : 'email = $1';
  const param = identifier.id ?? identifier.email;
  const res = await query(`UPDATE users SET approved = TRUE WHERE ${where} RETURNING id, email, approved`, [param]);
  return res.rows[0] || null;
}

export async function revokeUser(identifier: { id?: number; email?: string }) {
  if (!identifier.id && !identifier.email) throw new Error('id or email required');
  const where = identifier.id ? 'id = $1' : 'email = $1';
  const param = identifier.id ?? identifier.email;
  const res = await query(`UPDATE users SET approved = FALSE WHERE ${where} RETURNING id, email, approved`, [param]);
  return res.rows[0] || null;
}

export async function showUser(identifier: { id?: number; email?: string }) {
  if (!identifier.id && !identifier.email) throw new Error('id or email required');
  const where = identifier.id ? 'u.id = $1' : 'u.email = $1';
  const param = identifier.id ?? identifier.email;
  const res = await query(
    `SELECT u.id, u.email, u.display_name, u.approved, r.name AS role FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE ${where}`,
    [param]
  );
  return res.rows[0] || null;
}

export async function setRole(identifier: { id?: number; email?: string }, roleName: string) {
  if (!identifier.id && !identifier.email) throw new Error('id or email required');
  if (!roleName) throw new Error('roleName required');

  // Ensure role exists
  let { rows } = await query('SELECT id FROM roles WHERE name = $1', [roleName]);
  let roleId = rows[0]?.id;
  if (!roleId) {
    const res = await query('INSERT INTO roles (name) VALUES ($1) RETURNING id', [roleName]);
    roleId = res.rows[0].id;
  }

  const where = identifier.id ? 'id = $1' : 'email = $1';
  const param = identifier.id ?? identifier.email;
  const res = await query(`UPDATE users SET role_id = $1 WHERE ${where} RETURNING id, email`, [roleId, param]);
  return res.rows[0] || null;
}

function parseArgs(argv: string[]) {
  const cmd = argv[0];
  const args = argv.slice(1);
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
  return { cmd, parsed };
}

async function main() {
  const argv = process.argv.slice(2);
  const { cmd, parsed } = parseArgs(argv);

  try {
    switch (cmd) {
      case 'list-pending': {
        const rows = await listPending();
        if (rows.length === 0) {
          console.log('No pending users');
        } else {
          console.table(rows);
        }
        break;
      }
      case 'approve': {
        const id = parsed.id ? Number(parsed.id) : undefined;
        const email = parsed.email;
        const res = await approveUser({ id, email });
        if (res) console.log('Approved user', res);
        else console.log('User not found');
        break;
      }
      case 'revoke': {
        const id = parsed.id ? Number(parsed.id) : undefined;
        const email = parsed.email;
        const res = await revokeUser({ id, email });
        if (res) console.log('Revoked user', res);
        else console.log('User not found');
        break;
      }
      case 'show': {
        const id = parsed.id ? Number(parsed.id) : undefined;
        const email = parsed.email;
        const res = await showUser({ id, email });
        if (res) console.log(res);
        else console.log('User not found');
        break;
      }
      case 'set-role': {
        const id = parsed.id ? Number(parsed.id) : undefined;
        const email = parsed.email;
        const role = parsed.role;
        if (!role) {
          console.error('Missing --role <roleName>');
          process.exit(2);
        }
        const res = await setRole({ id, email }, role);
        if (res) console.log('Updated role for', res);
        else console.log('User not found');
        break;
      }
      default:
        console.log('Usage: admin <command> [--id <id> | --email <email>] [--role <role>]');
        console.log('Commands: list-pending, approve, revoke, show, set-role');
    }
    process.exit(0);
  } catch (e: any) {
    console.error('Error:', e && e.stack ? e.stack : e);
    process.exit(2);
  }
}

if (require.main === module) {
  main();
}
