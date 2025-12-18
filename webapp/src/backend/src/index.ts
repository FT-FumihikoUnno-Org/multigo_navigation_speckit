import express, { Express, Request, Response } from 'express';
import session from 'express-session';
import passport from './config/passport';
import { UserSchema } from './models/user.model';
import { RoleSchema } from './models/role.model';

import { isAdmin } from './middleware/auth';

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // for parsing application/json

app.use(session({
  secret: process.env.SESSION_SECRET || 'a_default_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.use(passport.initialize());
app.use(passport.session());


app.get('/', (req: Request, res: Response) => {
  res.send('Multi-Go Backend Server');
});

// Auth routes
app.get('/api/auth/login', passport.authenticate('oauth2'));

app.get('/api/auth/callback',
  passport.authenticate('oauth2', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

app.get('/api/auth/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error destroying session' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });
});


// A protected route for fetching the current user's data
app.get('/api/users/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

// Role Management routes
app.get('/api/users', isAdmin, async (req, res) => {
    // This should be protected and only accessible by Administrators
    try {
        const users = await UserSchema.findAll();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users" });
    }
});

app.post('/api/users/:id/role', isAdmin, async (req, res) => {
    // This should be protected and only accessible by Administrators
    try {
        const userId = parseInt(req.params.id, 10);
        const { roleId } = req.body;
        await RoleSchema.assignRoleToUser(userId, roleId);
        res.json({ message: "Role assigned successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error assigning role" });
    }
});


export default app;
