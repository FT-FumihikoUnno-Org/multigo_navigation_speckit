import express from 'express';
import session from 'express-session';
import passport from 'passport'; // Import passport setup
import { PORT, SESSION_SECRET } from './config'; // Import session secret
import { requestLogger } from './middleware/logging';
import { errorHandler } from './middleware/errorHandling';

// Import passport configuration to initialize it
import './config/passport';
import authRouter from './api/auth';
import userRouter from './api/users';

const app = express();
const port = PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Logging middleware
app.use(requestLogger);

// Session middleware
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }, // Use secure cookies in production
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Auth routes
app.use('/', authRouter); // Use the auth router for auth-related routes
app.use('/api', userRouter); // Use the user router for /api/me and other user-related routes

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Export the app for testing purposes
export default app;

// Start the server only when not testing
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}