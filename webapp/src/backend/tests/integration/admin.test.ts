import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { SESSION_SECRET } from '../../src/config';
import { isAuthenticated } from '../../src/middleware/auth';
import { query } from '../../src/config/database';

// Mock isAuthenticated to simulate authenticated users
jest.mock('../../src/middleware/auth', () => ({
  isAuthenticated: jest.fn((req, res, next) => {
    // Simulate authenticated user with a specific role
    (req as any).user = { id: 1, display_name: 'Test User', role: 'Caregiver' }; // Default non-admin
    next();
  }),
}));

// Mock query function for database interactions
jest.mock('../../src/config/database', () => ({
  query: jest.fn((sql, params) => {
    // Mock user data for deserialization if needed
    if (sql.includes('SELECT id FROM users WHERE id = $1')) {
      return Promise.resolve({ rows: [{ id: 1 }] });
    }
    // Mock for user role lookup during deserialization
    if (sql.includes('SELECT u.id, u.oidc_id, u.email, u.display_name, r.name as role')) {
      const mockRole = (isAuthenticated as jest.Mock).mock.calls[0][0].user.role; // Get role from mock user
      return Promise.resolve({ rows: [{ id: 1, oidc_id: 'mock_oidc', email: 'test@example.com', display_name: 'Test User', role: mockRole }] });
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

// A dummy admin-only route to test protection
const adminRouter = express.Router();
const requireRole = (roleName: string) => (req: request.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    if (user && user.role === roleName) {
        return next();
    }
    res.status(403).send('Forbidden');
};

adminRouter.get('/admin-only', isAuthenticated, requireRole('Administrator'), (req, res) => {
  res.status(200).send('Welcome Admin!');
});
app.use('/api', adminRouter);


describe('Admin Only Endpoint Protection', () => {
  afterEach(() => {
    // Reset mock before each test to ensure fresh state
    jest.clearAllMocks();
  });

  it('should return 403 Forbidden for a non-admin user', async () => {
    // Simulate a non-admin user (isAuthenticated mock defaults to 'Caregiver')
    (isAuthenticated as jest.Mock).mockImplementationOnce((req, res, next) => {
      (req as any).user = { id: 1, display_name: 'Caregiver User', role: 'Caregiver' };
      next();
    });

    const res = await request(app).get('/api/admin-only');
    expect(res.statusCode).toEqual(403);
    expect(res.text).toBe('Forbidden');
  });

  it('should allow access for an admin user', async () => {
    // Simulate an admin user
    (isAuthenticated as jest.Mock).mockImplementationOnce((req, res, next) => {
      (req as any).user = { id: 2, display_name: 'Admin User', role: 'Administrator' };
      next();
    });

    const res = await request(app).get('/api/admin-only');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('Welcome Admin!');
  });
});