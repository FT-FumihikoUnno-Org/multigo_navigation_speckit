import { Router } from 'express';
import passport from 'passport';
import { OIDC_REDIRECT_URI } from '../config';

const authRouter = Router();

// Initiate OpenID Connect authentication
authRouter.get('/auth/login', passport.authenticate('oidc'));

// Handle the OpenID Connect callback
authRouter.get(
  '/auth/openid/callback',
  passport.authenticate('oidc', {
    successRedirect: '/dashboard', // Frontend dashboard path
    failureRedirect: '/login', // Frontend login path
  })
);

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
