import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { SESSION_SECRET } from '../../src/config';
import authRouter from '../../src/api/auth';
import { query } from '../../src/config/database';

jest.mock('../../src/config/database');

const app = express();
app.use(express.json());
app.use(session({ secret: SESSION_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use('/', authRouter);

describe('Local auth', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST /auth/local should login existing local user', async () => {
    (query as jest.Mock).mockImplementation((sql: string, params: any[]) => {
      if (sql.includes('SELECT id, oidc_id, email')) {
        return Promise.resolve({ rows: [{ id: 1, email: 'admin@example.com', password_hash: 'salt$abc', local: true, force_password_change: false, approved: true, display_name: 'Admin' }] });
      }
      return Promise.resolve({ rows: [] });
    });

    // for scrypt verification we need to compute a real hash
    const { hashPasswordScrypt } = require('../../src/services/localAuth');
    const newHash = hashPasswordScrypt('password123');
    (query as jest.Mock).mockImplementation((sql: string, params: any[]) => {
      if (sql.includes('SELECT id, oidc_id, email')) {
        return Promise.resolve({ rows: [{ id: 1, email: 'admin@example.com', password_hash: newHash, local: true, force_password_change: false, approved: true, display_name: 'Admin' }] });
      }
      return Promise.resolve({ rows: [] });
    });

    const res = await request(app).post('/auth/local').send({ email: 'admin@example.com', password: 'password123' });
    expect(res.statusCode).toBe(200);
    expect(res.body.force_password_change).toBe(false);
  });

  it('POST /auth/local should require password change if force_password_change is true', async () => {
    const { hashPasswordScrypt } = require('../../src/services/localAuth');
    const newHash = hashPasswordScrypt('password123');
    (query as jest.Mock).mockImplementation((sql: string, params: any[]) => {
      if (sql.includes('SELECT id, oidc_id, email')) {
        return Promise.resolve({ rows: [{ id: 1, email: 'admin@example.com', password_hash: newHash, local: true, force_password_change: true, approved: true, display_name: 'Admin' }] });
      }
      return Promise.resolve({ rows: [] });
    });

    const res = await request(app).post('/auth/local').send({ email: 'admin@example.com', password: 'password123' });
    expect(res.statusCode).toBe(200);
    expect(res.body.force_password_change).toBe(true);
  });

  it('POST /auth/local/change-password should update password', async () => {
    const { hashPasswordScrypt } = require('../../src/services/localAuth');
    const oldHash = hashPasswordScrypt('oldpass');
    (query as jest.Mock).mockImplementation((sql: string, params: any[]) => {
      if (sql.includes('SELECT id, password_hash FROM users WHERE email')) {
        return Promise.resolve({ rows: [{ id: 1, password_hash: oldHash }] });
      }
      if (sql.includes('UPDATE users SET password_hash')) {
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve({ rows: [] });
    });

    const res = await request(app).post('/auth/local/change-password').send({ email: 'admin@example.com', oldPassword: 'oldpass', newPassword: 'newpass' });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Password changed');
  });
});