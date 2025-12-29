import { query } from '../../src/config/database';
import { runBootstrapAdmin } from '../../src/cmd/bootstrap-admin';

jest.mock('../../src/config/database');

describe('bootstrap-admin CLI', () => {
  afterEach(() => jest.resetAllMocks());

  it('creates role if missing and inserts user', async () => {
    // Mock role not existing then creation
    (query as jest.Mock).mockImplementationOnce((sql: string, params: any[]) => {
      if (sql.includes('SELECT id FROM roles')) return Promise.resolve({ rows: [] });
      return Promise.resolve({ rows: [] });
    }).mockImplementationOnce((sql: string, params: any[]) => {
      if (sql.includes('INSERT INTO roles')) return Promise.resolve({ rows: [{ id: 42 }] });
      return Promise.resolve({ rows: [] });
    }).mockImplementationOnce((sql: string, params: any[]) => {
      if (sql.includes('INSERT INTO users')) return Promise.resolve({ rows: [{ id: 123 }] });
      return Promise.resolve({ rows: [] });
    });

    const res = await runBootstrapAdmin({ email: 'a@b.c', password: 'pass', approve: false });
    expect(res.userId).toBe(123);

    expect((query as jest.Mock).mock.calls.some((c: any[]) => c[0].includes('SELECT id FROM roles'))).toBeTruthy();
    expect((query as jest.Mock).mock.calls.some((c: any[]) => c[0].includes('INSERT INTO roles'))).toBeTruthy();
    expect((query as jest.Mock).mock.calls.some((c: any[]) => c[0].includes('INSERT INTO users'))).toBeTruthy();
  });
});
