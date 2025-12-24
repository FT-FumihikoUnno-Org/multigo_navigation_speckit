import passport from 'passport';
import { Strategy as OpenIDConnectStrategy } from 'passport-openidconnect';
import {
  OIDC_CLIENT_ID,
  OIDC_CLIENT_SECRET,
  OIDC_ISSUER_URL,
  OIDC_REDIRECT_URI,
} from './index';
import { query } from './database';

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.oidc_id, u.email, u.display_name, r.name as role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [id]
    );
    done(null, rows[0]);
  } catch (err) {
    done(err);
  }
});

// --- Test Configuration for Dummy OIDC Server ---
// This configuration is used to test the authentication flow with a local dummy server.
// For local dev we need two addresses:
//  - OIDC_EXTERNAL_ISSUER: what the browser should be redirected to (e.g. http://localhost:3001)
//  - OIDC_ISSUER_URL: what the backend container uses to call token/userinfo (e.g. http://dummyauth:3001)
const DEV_INTERNAL_OIDC_ISSUER = process.env.OIDC_ISSUER_URL || 'http://dummyauth:3001';
const DEV_EXTERNAL_OIDC_ISSUER = process.env.OIDC_EXTERNAL_ISSUER || 'http://localhost:3001';
// For local development we use a simple in-memory state store that does not rely on express-session
// This helps avoid state verification failures when running in containers or during rapid restarts.
const createDevStateStore = () => {
  const map = new Map<string, { ctx: any; appState: any }>();
  return {
    store: (_req: any, ctx: any, appState: any, _meta: any, cb: (err: any, handle?: string) => void) => {
      const handle = Math.random().toString(36).slice(2);
      map.set(handle, { ctx, appState });
      console.log('[DEV STATE] store', { handle, ctx });
      cb(null, handle);
    },
    verify: (_req: any, handle: string, cb: (err: any, ctx?: any, appState?: any) => void) => {
      console.log('[DEV STATE] verify', { handle });
      const entry = map.get(handle);
      if (!entry) { console.warn('[DEV STATE] missing handle', { handle }); return cb(null, false, { message: 'Invalid or expired dev state handle.' }); }
      map.delete(handle);
      cb(null, entry.ctx, entry.appState);
    },
  };
};

passport.use(
  'oidc',
  new OpenIDConnectStrategy(
    {
      // Use the external issuer for the authorization endpoint (browser redirectable)
      authorizationURL: `${DEV_EXTERNAL_OIDC_ISSUER}/authorize`,
      // Use the internal issuer for token and userinfo calls from the backend container
      tokenURL: `${DEV_INTERNAL_OIDC_ISSUER}/token`,
      userInfoURL: `${DEV_INTERNAL_OIDC_ISSUER}/userinfo`,
      // The issuer claim in the ID token is what the token is signed as (typically the externally-reachable issuer URL).
      // Use the external issuer here so ID token 'iss' verification matches.
      issuer: DEV_EXTERNAL_OIDC_ISSUER,
      clientID: process.env.OIDC_CLIENT_ID || 'my-dummy-client-id',
      clientSecret: process.env.OIDC_CLIENT_SECRET || 'my-dummy-client-secret',
      callbackURL: OIDC_REDIRECT_URI,
      scope: 'openid profile email',
      // Use the dev state store when not in production to avoid relying on express-session for state
      store: process.env.NODE_ENV === 'production' ? undefined : createDevStateStore(),
    },

    // The verify function needs to be adapted for the dummy server's expected response.
    // For this test, we can create a mock user.
    async (issuer: any, profile: any, done: (err: any, user?: any) => void) => {
      try {
        // Extract profile fields (strategy normalizes profile)
        const oidc_id = profile.id || profile.sub;
        const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || profile.email || `${oidc_id}@example.com`;
        const displayName = profile.displayName || (profile.name ? profile.name.givenName : oidc_id);

        // Check if user exists
        let { rows } = await query('SELECT u.id, u.oidc_id, u.email, u.display_name, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.oidc_id = $1', [oidc_id]);
        let user = rows[0];
        if (!user) {
          // Create user with default role 'Caregiver'
          const defaultRole = 'Caregiver';
          const { rows: roleRows } = await query('SELECT id FROM roles WHERE name = $1', [defaultRole]);
          const roleId = roleRows[0]?.id;

          if (!roleId) {
            // If role doesn't exist, create it
            const { rows: newRoleRows } = await query('INSERT INTO roles (name) VALUES ($1) RETURNING id', [defaultRole]);
            if (!newRoleRows[0]) return done(new Error(`Failed to create default role '${defaultRole}'.`));
            const createdRoleId = newRoleRows[0].id;
            const { rows: createdUserRows } = await query('INSERT INTO users (oidc_id, email, display_name, role_id) VALUES ($1, $2, $3, $4) RETURNING id, oidc_id, email, display_name', [oidc_id, email, displayName, createdRoleId]);
            user = createdUserRows[0];
          } else {
            const { rows: newRows } = await query('INSERT INTO users (oidc_id, email, display_name, role_id) VALUES ($1, $2, $3, $4) RETURNING id, oidc_id, email, display_name', [oidc_id, email, displayName, roleId]);
            user = newRows[0];
          }
        }

        console.log('OIDC verify callback found/created user:', { id: user.id, oidc_id: user.oidc_id });
        return done(null, user);
      } catch (err: any) {
        done(err);
      }
    }
  )
);

// --- Original Configuration ---
// passport.use(
//   'oidc',
//   new OpenIDConnectStrategy(
//     {
//       issuer: OIDC_ISSUER_URL,
//       authorizationURL: `${OIDC_ISSUER_URL}/protocol/openid-connect/auth`, // Adjust for your IdP
//       tokenURL: `${OIDC_ISSUER_URL}/protocol/openid-connect/token`, // Adjust for your IdP
//       userInfoURL: `${OIDC_ISSUER_URL}/protocol/openid-connect/userinfo`, // Adjust for your IdP
//       clientID: OIDC_CLIENT_ID,
//       clientSecret: OIDC_CLIENT_SECRET,
//       callbackURL: OIDC_REDIRECT_URI,
//       scope: 'openid profile email',
//     },
//     async (issuer: string, profile: any, done: (err: any, user?: any) => void) => {
//       try {
//         const oidc_id = profile.id;
//         const email = profile.emails[0].value;
//         const displayName = profile.displayName || (profile.name ? profile.name.givenName : '');

//         // Check if user exists
//         let { rows } = await query('SELECT * FROM users WHERE oidc_id = $1', [oidc_id]);

//         let user = rows[0];
//         if (!user) {
//           // If user does not exist, create a new one with a default role (e.g., 'Caregiver')
//           const defaultRole = 'Caregiver'; // Or any other default role
//           const { rows: roleRows } = await query('SELECT id FROM roles WHERE name = $1', [defaultRole]);
//           const roleId = roleRows[0]?.id;

//           if (!roleId) {
//             return done(new Error(`Default role '${defaultRole}' not found.`));
//           }

//           const { rows: newRows } = await query(
//             'INSERT INTO users (oidc_id, email, display_name, role_id) VALUES ($1, $2, $3, $4) RETURNING *',
//             [oidc_id, email, displayName, roleId]
//           );
//           user = newRows[0];
//         }
//         done(null, user);
//       } catch (err: any) {
//         done(err);
//       }
//     }
//   )
// );


export default passport;
