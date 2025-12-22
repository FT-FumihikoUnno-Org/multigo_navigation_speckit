import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as OpenIDConnectStrategy } from 'passport-openidconnect';
import { OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_ISSUER_URL, OIDC_REDIRECT_URI, SESSION_SECRET } from '../../src/config';
import { query } from '../../src/config/database';

// Mock the passport strategy to avoid actual OIDC calls during testing
jest.mock('passport-openidconnect', () => {
  return {
    Strategy: jest.fn().mockImplementation((options, verify) => {
      // Simulate successful verification with a mock profile
      const mockProfile = {
        id: 'mock_oidc_id',
        emails: [{ value: 'test@example.com' }],
        displayName: 'Test User',
      };
      // Immediately call verify with the mock profile
      setImmediate(() => verify(options.issuer, mockProfile, (err: any, user: any) => {
        // Mock user creation/lookup in DB
        Promise.resolve().then(async () => {
          let { rows } = await query('SELECT * FROM users WHERE oidc_id = $1', [mockProfile.id]);
          let user = rows[0];
          if (!user) {
            const defaultRole = 'Caregiver';
            const { rows: roleRows } = await query('SELECT id FROM roles WHERE name = $1', [defaultRole]);
            const roleId = roleRows[0]?.id;
            const { rows: newRows } = await query(
              'INSERT INTO users (oidc_id, email, display_name, role_id) VALUES ($1, $2, $3, $4) RETURNING *',
              [mockProfile.id, mockProfile.emails[0].value, mockProfile.displayName, roleId]
            );
            user = newRows[0];
          }
          return user;
        }).then(user => done(null, user));
      }));
    }),
  };
});

// Mock database query to avoid actual DB calls for roles
jest.mock('../../src/config/database', () => ({
  query: jest.fn((sql, params) => {
    if (sql.includes('SELECT id FROM roles WHERE name = $1')) {
      if (params[0] === 'Caregiver') {
        return Promise.resolve({ rows: [{ id: 1 }] }); // Mock role ID
      }
    }
    if (sql.includes('SELECT * FROM users WHERE oidc_id = $1')) {
      // Simulate user not found initially
      return Promise.resolve({ rows: [] });
    }
    if (sql.includes('INSERT INTO users')) {
      return Promise.resolve({ rows: [{ id: 1, oidc_id: params[0], email: params[1], display_name: params[2], role_id: params[3] }] });
    }
    if (sql.includes('SELECT u.id, u.oidc_id, u.email, u.display_name, r.name as role')) {
      return Promise.resolve({ rows: [{ id: 1, oidc_id: 'mock_oidc_id', email: 'test@example.com', display_name: 'Test User', role: 'Caregiver' }] });
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

// Configure passport for the mock strategy
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
passport.use(new OpenIDConnectStrategy({
  issuer: OIDC_ISSUER_URL,
  authorizationURL: `${OIDC_ISSUER_URL}/protocol/openid-connect/auth`,
  tokenURL: `${OIDC_ISSUER_URL}/protocol/openid-connect/token`,
  userInfoURL: `${OIDC_ISSUER_URL}/protocol/openid-connect/userinfo`,
  clientID: OIDC_CLIENT_ID,
  clientSecret: OIDC_CLIENT_SECRET,
  callbackURL: OIDC_REDIRECT_URI,
  scope: 'openid profile email',
}, jest.fn())); // Mock verify function


app.get('/auth/openid', passport.authenticate('oidc'));
app.get(
  '/auth/openid/callback',
  passport.authenticate('oidc', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
  })
);

describe('OpenID Connect Callback', () => {
  it('should redirect to /dashboard on successful authentication and create a session', async () => {
    const res = await request(app).get('/auth/openid/callback').expect(302);
    expect(res.header.location).toBe('/dashboard');
  });

  // Add more tests for failure cases, user existence, etc.
});