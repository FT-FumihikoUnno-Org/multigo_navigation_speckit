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

passport.use(
  'oidc',
  new OpenIDConnectStrategy(
    {
      issuer: OIDC_ISSUER_URL,
      authorizationURL: `${OIDC_ISSUER_URL}/protocol/openid-connect/auth`, // Adjust for your IdP
      tokenURL: `${OIDC_ISSUER_URL}/protocol/openid-connect/token`, // Adjust for your IdP
      userInfoURL: `${OIDC_ISSUER_URL}/protocol/openid-connect/userinfo`, // Adjust for your IdP
      clientID: OIDC_CLIENT_ID,
      clientSecret: OIDC_CLIENT_SECRET,
      callbackURL: OIDC_REDIRECT_URI,
      scope: 'openid profile email',
    },
    async (issuer: string, profile: any, done: (err: any, user?: any) => void) => {
      try {
        const oidc_id = profile.id;
        const email = profile.emails[0].value;
        const displayName = profile.displayName || (profile.name ? profile.name.givenName : '');

        // Check if user exists
        let { rows } = await query('SELECT * FROM users WHERE oidc_id = $1', [oidc_id]);

        let user = rows[0];
        if (!user) {
          // If user does not exist, create a new one with a default role (e.g., 'Caregiver')
          const defaultRole = 'Caregiver'; // Or any other default role
          const { rows: roleRows } = await query('SELECT id FROM roles WHERE name = $1', [defaultRole]);
          const roleId = roleRows[0]?.id;

          if (!roleId) {
            return done(new Error(`Default role '${defaultRole}' not found.`));
          }

          const { rows: newRows } = await query(
            'INSERT INTO users (oidc_id, email, display_name, role_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [oidc_id, email, displayName, roleId]
          );
          user = newRows[0];
        }
        done(null, user);
      } catch (err: any) {
        done(err);
      }
    }
  )
);

export default passport;
