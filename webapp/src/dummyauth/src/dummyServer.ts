import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { generateKeyPair, SignJWT, exportJWK } from 'jose';
import crypto from 'crypto';
// Ensure Web Crypto API is available for jose when running under Node 18
if (!(globalThis as any).crypto) {
  (globalThis as any).crypto = (crypto as any).webcrypto;
}
// uuidv4 is replaced by crypto.randomUUID()
// import { v4 as uuidv4 } from 'uuid';
import { Buffer } from 'buffer'; // Buffer is needed for key export type compatibility if needed, though exportJWK returns an object directly.

dotenv.config();

const app = express();
const port = process.env.DUMMY_SERVER_PORT || 3001;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// --- OIDC 設定 ---
const ISSUER = 'http://localhost:3001'; // Dummy Auth Server Issuer URI
const CLIENT_ID_SECRET = 'my-dummy-client-id'; // Dummy client ID
const CLIENT_SECRET = 'my-dummy-client-secret'; // Dummy client secret
const CODE_EXPIRY_SECONDS = 300; // Authorization code expiry in seconds

// RSA Key generation & JWK caching
// Use permissive 'any' types because keys can be CryptoKey or KeyObject depending on environment
let publicKey: any;
let privateKey: any;
let jwk: any;
let jwks: { keys: any[] } = { keys: [] };

async function initializeKeys() {
  try {
    const keys = await generateKeyPair('RS256');
    publicKey = keys.publicKey;
    privateKey = keys.privateKey;
    jwk = await exportJWK(publicKey);
    jwk.kid = '1'; // Key ID
    jwk.use = 'sig'; // Key Use
    jwk.alg = 'RS256'; // Algorithm
    jwk.kty = 'RSA'; // Key Type
    jwks = { keys: [jwk] };
    console.log('RSA Keys generated and cached.');
  } catch (error) {
    console.error('Error generating RSA keys:', error);
    process.exit(1);
  }
}

// --- In-memory management for Authorization Codes ---
// { code: { client_id, redirect_uri, state, nonce, username, timestamp }, ... }
const authCodes = new Map<string, { client_id: string; redirect_uri: string; state: string; nonce?: string; username: string; timestamp: number }>();

// --- HTML Login Form ---
const loginFormHTML = (errorMessage?: string, oidcParams?: Record<string, string>) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dummy Auth Login</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 80vh; background-color: #eef2f6; margin: 0; }
        .container { background-color: #ffffff; padding: 40px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); width: 350px; text-align: center; }
        h2 { margin-bottom: 25px; color: #333; font-size: 1.8em; }
        .form-group { margin-bottom: 20px; text-align: left; }
        label { display: block; margin-bottom: 8px; font-weight: 600; color: #555; font-size: 0.95em; }
        input[type="email"], input[type="password"], input[type="hidden"] {
            width: calc(100% - 24px);
            padding: 12px;
            border: 1px solid #ccc;
            border-radius: 6px;
            font-size: 1em;
            box-sizing: border-box;
        }
        input[type="email"]:focus, input[type="password"]:focus {
            border-color: #007bff;
            outline: none;
            box-shadow: 0 0 0 3px rgba(0,123,255,0.25);
        }
        .button-group { display: flex; gap: 10px; margin-top: 20px; }
        button {
            flex: 1;
            padding: 14px;
            border: none;
            border-radius: 6px;
            font-size: 1.1em;
            cursor: pointer;
            transition: background-color 0.3s ease, transform 0.2s ease;
        }
        button.login { background-color: #007bff; color: white; }
        button.login:hover { background-color: #0056b3; }
        button.fail { background-color: #dc3545; color: white; }
        button.fail:hover { background-color: #c82333; }
        button:active { transform: translateY(1px); }
        .error-message { color: #dc3545; margin-bottom: 20px; font-weight: 500; padding: 10px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Dummy Authentication</h2>
        ${errorMessage ? `<p class="error-message">${errorMessage}</p>` : ''}
        <form method="post" action="/authorize-login">
            <!-- Hidden inputs for OIDC parameters -->
            ${Object.entries(oidcParams || {}).map(([key, value]) =>
              `<input type="hidden" name="${key}" value="${value}">`
            ).join('')}

            <div class="form-group">
                <label for="username">Username:</label>
                <input type="text" id="username" name="username" required aria-label="Username">
            </div>
            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" required aria-label="Password">
            </div>
            <div class="button-group">
                <button type="submit" formaction="/authorize-login" formmethod="post" class="login">Login</button>
                <button type="submit" formaction="/simulate-auth-failure" formmethod="post" class="fail">Simulate Auth Failure</button>
            </div>
        </form>
    </div>
</body>
</html>
`;

// --- OIDC Endpoints ---

// 1) Authorization Endpoint (GET)
app.get('/authorize', (req, res) => {
  console.log('[Auth Server] GET /authorize');
  const queryParams = req.query as Record<string, string>;
  const { response_type, client_id, redirect_uri, state, nonce } = queryParams;

  if (!response_type || !client_id || !redirect_uri || !state) {
    return res.status(400).send('Missing required OIDC parameters (response_type, client_id, redirect_uri, state)');
  }

  console.log('Received OIDC params:', { response_type, client_id, redirect_uri, state, nonce });

  res.send(loginFormHTML(undefined, { response_type, client_id, redirect_uri, state, nonce }));
});

// 2) Authorization Code Grant (POST from login form)
app.post('/authorize-login', async (req, res) => {
  console.log('[Auth Server] POST /authorize-login');
  const { username, password, response_type, client_id, redirect_uri, state, nonce } = req.body as Record<string, string>;

  if (!username || !password) {
    console.log('Missing username or password');
    // Use 303 to instruct the user-agent to GET the login page on redirect after a POST
    return res.redirect(303, `/login?error=${encodeURIComponent('Username and password are required.')}&state=${state || ''}`);
  }

  const user = { username: username }; // Dummy user object

  const code = crypto.randomUUID(); // Use Node.js crypto module for UUID
  const authCodeData = { client_id, redirect_uri, state, nonce, username: user.username, timestamp: Date.now() };

  // Store code in memory with expiry
  authCodes.set(code, authCodeData);
  console.log(`Generated auth code: ${code}`);

  // Basic cleanup for expired codes (run once after code is generated)
  setTimeout(() => {
    if (authCodes.has(code)) {
      const data = authCodes.get(code);
      if (data && (Date.now() - data.timestamp) > CODE_EXPIRY_SECONDS * 1000) {
        authCodes.delete(code);
        console.log(`Auth code ${code} expired and removed.`);
      }
    }
  }, CODE_EXPIRY_SECONDS * 1000 + 1000);

  const finalRedirectUri = `${redirect_uri}?code=${code}&state=${state}`;
  console.log(`Redirecting to client: ${finalRedirectUri}`);
  // Use 303 See Other on form POST responses to ensure user-agent performs a GET to the callback
  res.redirect(303, finalRedirectUri);
});

// Route to simulate authentication failure
app.post('/simulate-auth-failure', async (req, res) => {
  const { state } = req.body as Record<string, string>; // Need state to redirect back correctly
  const errorMessage = 'Simulated authentication failure.';
  console.log('Simulating authentication failure.');
  // Redirect back to login page with error, preserving state if provided
  const redirectUrl = `/login?error=${encodeURIComponent(errorMessage)}${state ? `&state=${state}` : ''}`;
  // Use 303 to ensure the client performs a GET when redirected after POST
  res.redirect(303, redirectUrl);
});

// 3) Token Endpoint (POST)
app.post('/token', async (req, res) => {
  console.log('[Auth Server] POST /token');
  const { grant_type, code, redirect_uri, client_id } = req.body as Record<string, string>;

  console.log('Received token request:', { grant_type, code, redirect_uri, client_id });

  if (grant_type !== 'authorization_code') {
    return res.status(400).json({ error: 'unsupported_grant_type', error_description: 'Only authorization_code grant type is supported.' });
  }

  const authCodeData = authCodes.get(code);

  if (!authCodeData) {
    console.log(`Auth code not found or expired: ${code}`);
    return res.status(400).json({ error: 'invalid_grant', error_description: 'Authorization code is invalid or expired.' });
  }

  if (authCodeData.client_id !== client_id || authCodeData.redirect_uri !== redirect_uri) {
    console.log('Client ID or Redirect URI mismatch.');
    return res.status(400).json({ error: 'invalid_grant', error_description: 'Client ID or Redirect URI mismatch.' });
  }

  if ((Date.now() - authCodeData.timestamp) > CODE_EXPIRY_SECONDS * 1000) {
    authCodes.delete(code);
    console.log(`Auth code ${code} expired during token request.`);
    return res.status(400).json({ error: 'invalid_grant', error_description: 'Authorization code has expired.' });
  }

  authCodes.delete(code);
  console.log(`Auth code ${code} validated and removed.`);

  const id_token = await new SignJWT({
    sub: authCodeData.username,
    aud: client_id,
    nonce: authCodeData.nonce,
    name: authCodeData.username,
    email: authCodeData.username,
  })
    .setProtectedHeader({ alg: 'RS256', kid: '1' })
    .setIssuedAt(new Date())
    .setIssuer(ISSUER)
    .setExpirationTime('2h')
    .sign(privateKey);

  const access_token = code; // Dummy access token

  console.log(`Tokens issued for user ${authCodeData.username}.`);
  res.json({
    access_token: access_token,
    id_token: id_token,
    token_type: 'Bearer',
    expires_in: 7200,
  });
});

// 4) JWKS Endpoint (GET)
app.get('/jwks.json', (req, res) => {
  console.log('[Auth Server] GET /jwks.json');
  res.json(jwks);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'Dummy auth server is running',
    port: port,
    issuer: ISSUER,
    endpoints: {
        authorize: `${ISSUER}/authorize`,
        token: `${ISSUER}/token`,
        jwks: `${ISSUER}/jwks.json`
    }
  });
});

// --- Server Initialization ---
async function startServer() {
  await initializeKeys();
  app.listen(port, () => {
    console.log(`Dummy OIDC Authentication Server is running on ${ISSUER}`);
  });
}

startServer();