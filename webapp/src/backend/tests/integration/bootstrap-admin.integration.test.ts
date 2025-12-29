import { spawnSync } from 'child_process';
import path from 'path';
import { runBootstrapAdmin } from '../../src/cmd/bootstrap-admin';
import { query } from '../../src/config/database';

const isEnabled = process.env.RUN_BOOTSTRAP_ADMIN_INTEGRATION === '1';

// Integration test is opt-in to avoid touching a developer's local DB unintentionally.
(isEnabled ? describe : describe.skip)('bootstrap-admin CLI integration', () => {
  const backendDir = path.resolve(__dirname, '../../');
  const testEmail = `integration-admin-${Date.now()}@example.com`;
  const testPassword = 'ChangeMe123!';

  beforeAll(() => {
    // Run migrations to ensure schema exists
    const res = spawnSync('npm', ['run', 'migrate'], { cwd: backendDir, stdio: 'inherit', env: process.env });
    if (res.error || res.status !== 0) {
      throw new Error('Failed to run migrations before integration test');
    }
  }, 120000);

  test('creates an admin user and marks approved when --approve used', async () => {
    const result = await runBootstrapAdmin({ email: testEmail, password: testPassword, approve: true });
    expect(result).toHaveProperty('userId');
    expect(result).toHaveProperty('roleId');
    expect(result.approved).toBe(true);

    const { rows } = await query('SELECT id, email, approved FROM users WHERE email = $1', [testEmail]);
    expect(rows.length).toBe(1);
    expect(rows[0].approved).toBe(true);

    // cleanup
    await query('DELETE FROM users WHERE email = $1', [testEmail]);
  }, 30000);
});
