import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { SESSION_SECRET } from '../../src/config';
import { isAuthenticated } from '../../src/middleware/auth';
import { requireRole } from '../../src/middleware/roles';
import { query } from '../../src/config/database';
import { Router } from 'express'; // Import Router for user routes

// Mock isAuthenticated to simulate authenticated users
jest.mock('../../src/middleware/auth', () => ({
  isAuthenticated: jest.fn((req, res, next) => {
    // Simulate authenticated user with a specific role
    (req as any).user = { id: 1, display_name: 'Test User', role: 'Administrator' }; // Default to Admin for testing admin endpoints
    next();
  }),
}));

// Mock database query to avoid actual DB calls
jest.mock('../../src/config/database', () => ({
  query: jest.fn((sql, params) => {
    // Mock for roles table
    if (sql.includes('SELECT id FROM roles WHERE name = $1')) {
      if (params[0] === 'Administrator') return Promise.resolve({ rows: [{ id: 1 }] });
      if (params[0] === 'Nurse') return Promise.resolve({ rows: [{ id: 2 }] });
      if (params[0] === 'Caregiver') return Promise.resolve({ rows: [{ id: 3 }] });
    }
    // Mock for fetching users (flexible matching across formatting)
    if (sql.includes('SELECT u.id') && sql.includes('JOIN roles r')) {
      return Promise.resolve({
        rows: [
          { id: 1, oidc_id: 'oidc1', email: 'admin@example.com', display_name: 'Admin User', role: 'Administrator' },
          { id: 2, oidc_id: 'oidc2', email: 'nurse@example.com', display_name: 'Nurse User', role: 'Nurse' },
        ],
      });
    }
    // Mock for updating user role
    if (sql.includes('UPDATE users SET role_id = $1 WHERE id = $2 RETURNING *')) {
      const newRoleId = params[0];
      const userId = params[1];
      let newRoleName = '';
      if (newRoleId === 1) newRoleName = 'Administrator';
      if (newRoleId === 2) newRoleName = 'Nurse';
      if (newRoleId === 3) newRoleName = 'Caregiver';
      return Promise.resolve({
        rows: [{ id: userId, oidc_id: `oidc${userId}`, email: `user${userId}@example.com`, display_name: `User ${userId}`, role: newRoleName }],
      });
    }
    return Promise.resolve({ rows: [] });
  }),
}));


const app = express();
app.use(express.json());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// Mock serialize/deserialize for testing purposes
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id: number, done) => {
  try {
    const { rows } = await query('SELECT id FROM users WHERE id = $1', [id]);
    done(null, rows[0]);
  } catch (err) {
    done(err);
  }
});

const userRouter = Router();

// GET /api/users
userRouter.get('/users', isAuthenticated, requireRole('Administrator'), async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.oidc_id, u.email, u.display_name, r.name as role
       FROM users u
       JOIN roles r ON u.role_id = r.id`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Internal Server Error');
  }
});

// PUT /api/users/:id/role
userRouter.put('/users/:id/role', isAuthenticated, requireRole('Administrator'), async (req, res) => {
  const { id } = req.params;
  const { roleName } = req.body; // Expecting roleName like 'Administrator', 'Nurse', etc.

  try {
    const { rows: roleRows } = await query('SELECT id FROM roles WHERE name = $1', [roleName]);
    if (roleRows.length === 0) {
      return res.status(400).send('Invalid role name');
    }
    const roleId = roleRows[0].id;

    const { rows } = await query(
      'UPDATE users SET role_id = $1 WHERE id = $2 RETURNING *',
      [roleId, id]
    );

    if (rows.length > 0) {
      res.json({ message: 'User role updated successfully', user: rows[0] });
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.use('/api', userRouter);


describe('User Management Endpoints (Admin Only)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test for GET /api/users
  it('GET /api/users should return a list of users for an admin', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual([
      { id: 1, oidc_id: 'oidc1', email: 'admin@example.com', display_name: 'Admin User', role: 'Administrator' },
      { id: 2, oidc_id: 'oidc2', email: 'nurse@example.com', display_name: 'Nurse User', role: 'Nurse' },
    ]);
  });

  it('GET /api/users should return 403 for a non-admin user', async () => {
    (isAuthenticated as jest.Mock).mockImplementationOnce((req, res, next) => {
      (req as any).user = { id: 3, display_name: 'Non Admin User', role: 'Caregiver' };
      next();
    });
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toEqual(403);
  });

  // Test for PUT /api/users/:id/role
  it('PUT /api/users/:id/role should update a user\'s role for an admin', async () => {
    const res = await request(app)
      .put('/api/users/2/role')
      .send({ roleName: 'Administrator' }); // Change Nurse User to Admin

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe('User role updated successfully');
    expect(res.body.user.role).toBe('Administrator');
  });

  it('PUT /api/users/:id/role should return 403 for a non-admin user', async () => {
    (isAuthenticated as jest.Mock).mockImplementationOnce((req, res, next) => {
      (req as any).user = { id: 3, display_name: 'Non Admin User', role: 'Caregiver' };
      next();
    });
    const res = await request(app)
      .put('/api/users/1/role')
      .send({ roleName: 'Nurse' });
    expect(res.statusCode).toEqual(403);
  });

  it('PUT /api/users/:id/role should return 400 for an invalid role name', async () => {
    const res = await request(app)
      .put('/api/users/1/role')
      .send({ roleName: 'InvalidRole' });
    expect(res.statusCode).toEqual(400);
    expect(res.text).toBe('Invalid role name');
  });

  it('PUT /api/users/:id/role should return 404 for a user not found', async () => {
    // Override query to simulate 'user not found' on UPDATE while preserving other mocks
    (query as jest.Mock).mockImplementation((sql, params) => {
        // Simulate missing user for the UPDATE call
        if (sql.includes('UPDATE users SET role_id = $1 WHERE id = $2 RETURNING *')) {
            return Promise.resolve({ rows: [] }); // Simulate user not found
        }
        // Role lookup
        if (sql.includes('SELECT id FROM roles WHERE name = $1')) {
            if (params[0] === 'Administrator') return Promise.resolve({ rows: [{ id: 1 }] });
            if (params[0] === 'Nurse') return Promise.resolve({ rows: [{ id: 2 }] });
            if (params[0] === 'Caregiver') return Promise.resolve({ rows: [{ id: 3 }] });
        }
        // Fetching users
        if (sql.includes('SELECT u.id') && sql.includes('JOIN roles r')) {
            return Promise.resolve({
              rows: [
                { id: 1, oidc_id: 'oidc1', email: 'admin@example.com', display_name: 'Admin User', role: 'Administrator' },
                { id: 2, oidc_id: 'oidc2', email: 'nurse@example.com', display_name: 'Nurse User', role: 'Nurse' },
              ],
            });
        }
        // Default
        return Promise.resolve({ rows: [] });
    });

    const res = await request(app)
      .put('/api/users/999/role') // Non-existent user ID
      .send({ roleName: 'Nurse' });
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('User not found');
  });
});
