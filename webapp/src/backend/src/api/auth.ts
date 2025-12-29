import { Router } from 'express';
import passport from 'passport';
import { OIDC_REDIRECT_URI, FRONTEND_URL } from '../config';
import { query } from '../config/database';
import { verifyPassword, hashPasswordScrypt } from '../services/localAuth';

const authRouter = Router();

// Initiate OpenID Connect authentication
const isDev = process.env.NODE_ENV !== 'production';
authRouter.get('/auth/login', (req, res, next) => {
  if (isDev) console.log('DEBUG: /auth/login initial session', { session: req.session });
  next();
}, passport.authenticate('oidc'));

// Debug helper to inspect session contents during development
authRouter.get('/debug/session', (req, res) => {
  res.json({ session: req.session });
});

// Handle the OpenID Connect callback (with verbose debug)
authRouter.get('/auth/openid/callback', (req, res, next) => {
  // Basic incoming info
  if (isDev) console.log('DEBUG: /auth/openid/callback hit', {
    method: req.method,
    query: req.query,
    headers: req.headers,
    sessionPresent: !!req.session,
    sessionId: req.sessionID || null,
  });

  // Use a custom callback to capture passport errors/info
  passport.authenticate('oidc', (err: any, user: any, info: any) => {
    if (isDev) console.log('DEBUG: passport.authenticate callback', { err: err ? err.message || err : null, user: !!user, info });

    if (err) {
      console.error('ERROR during OIDC authenticate:', err);
      return next(err);
    }

    if (!user) {
      console.warn('WARN: OIDC authentication failed, no user returned', { info });
      // Redirect back to frontend login page
      return res.redirect(`${FRONTEND_URL}/login`);
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        console.error('ERROR logging in user after OIDC auth:', loginErr);
        return next(loginErr);
      }
      console.log('SUCCESS: User logged in via OIDC', { userId: user.id });
      // If the user exists but is not yet approved, send them to a pending approval page
      if (user && user.approved === false) {
        if (isDev) console.log('User is not approved yet, redirecting to pending approval.', { userId: user.id });
        return res.redirect(`${FRONTEND_URL}/pending`);
      }
      // Redirect to frontend dashboard for approved users
      return res.redirect(`${FRONTEND_URL}/dashboard`);
    });
  })(req, res, next);
});

// Local login: expects { email, password }
authRouter.post('/auth/local', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).send('Missing credentials');

  try {
    const { rows } = await query('SELECT id, oidc_id, email, display_name, password_hash, local, force_password_change, role_id, approved FROM users WHERE email = $1', [email]);
    if (rows.length === 0) return res.status(401).send('Invalid credentials');
    const user = rows[0];
    if (!user.local || !user.password_hash) return res.status(401).send('Local login not enabled');
    const ok = verifyPassword(user.password_hash, password);
    if (!ok) return res.status(401).send('Invalid credentials');

    if (!user.approved) return res.status(403).send('Account not approved');

    if (typeof (req as any).logIn !== 'function') {
      console.error('Passport not initialized; login unavailable');
      return res.status(500).send('Login failed');
    }

    (req as any).logIn(user, (err: any) => {
      if (err) {
        console.error('ERROR logging in user after local auth:', err && err.stack ? err.stack : err);
        return res.status(500).send('Login failed');
      }
      const needsPasswordChange = !!user.force_password_change;
      res.json({ message: 'ok', force_password_change: needsPasswordChange });
    });
  } catch (e: any) {
    console.error('Local login error', e && e.stack ? e.stack : e);
    res.status(500).send('Internal Server Error');
  }
});

// Change password: expects { email, oldPassword, newPassword }
authRouter.post('/auth/local/change-password', async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;
  if (!email || !oldPassword || !newPassword) return res.status(400).send('Missing parameters');
  try {
    const { rows } = await query('SELECT id, password_hash FROM users WHERE email = $1', [email]);
    if (rows.length === 0) return res.status(404).send('User not found');
    const user = rows[0];
    if (!user.password_hash) return res.status(400).send('No local password set');
    if (!verifyPassword(user.password_hash, oldPassword)) return res.status(401).send('Invalid credentials');

    const newHash = hashPasswordScrypt(newPassword);
    await query('UPDATE users SET password_hash = $1, force_password_change = FALSE WHERE id = $2', [newHash, user.id]);
    res.json({ message: 'Password changed' });
  } catch (e) {
    console.error('Change password error', e);
    res.status(500).send('Internal Server Error');
  }
});

// Logout route
authRouter.post('/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return next(err);
      }
      res.clearCookie('connect.sid'); // Clear session cookie
      res.status(200).send('Logged out');
    });
  });
});

export default authRouter;
