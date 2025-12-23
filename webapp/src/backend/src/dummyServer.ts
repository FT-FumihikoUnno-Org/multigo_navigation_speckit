import express from 'express';
import dummyAuthRouter from './api/dummyAuth';

const app = express();
const port = 3001; // Use a different port than the main server

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// This route is for the initial OIDC authorization request
app.get('/auth', (req, res) => {
  // In a real OIDC provider, this would show a login page.
  // For our test, we just confirm the endpoint was reached.
  // The actual test will verify the redirect *to* this URL.
  res.status(200).send('Dummy OIDC Authorization Endpoint Reached');
});

// The /token and /userinfo endpoints are also needed for the OIDC flow.
// We'll add simple placeholders for them.
app.post('/token', (req, res) => {
  res.status(200).json({
    access_token: 'dummy-access-token',
    token_type: 'Bearer',
    id_token: 'dummy-id-token',
  });
});

app.get('/userinfo', (req, res) => {
  res.status(200).json({
    sub: 'dummy-user-123',
    email: 'dummy@example.com',
    name: 'Dummy User',
  });
});


app.use('/', dummyAuthRouter);

app.listen(port, () => {
  console.log(`Dummy auth server running on port ${port}`);
});
