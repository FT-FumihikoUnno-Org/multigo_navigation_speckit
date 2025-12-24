import { Router } from 'express';
import passport from 'passport';
import { OIDC_REDIRECT_URI, FRONTEND_URL } from '../config';

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
      // Redirect to frontend dashboard
      return res.redirect(`${FRONTEND_URL}/dashboard`);
    });
  })(req, res, next);
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
