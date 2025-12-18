import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { User, UserSchema } from '../models/user.model';
import { RoleSchema } from '../models/role.model';

// Define Profile and VerifyCallback locally as they are not directly exported from passport-oauth2
interface OAuth2Profile {
  id: string;
  displayName: string;
  emails?: [{ value: string }];
  // Add other properties you expect from the OAuth provider's profile, e.g., 'sub' for OIDC
  sub?: string; 
}

// Define VerifyCallback locally
type VerifyCallback = (error: any, user?: any, info?: any) => void;

passport.use(new OAuth2Strategy({
    // Use standard OIDC endpoints. These are examples and would need to be configured.
    authorizationURL: process.env.OIDC_AUTH_URL || 'https://myoidcprovider.com/auth/realms/myrealm/protocol/openid-connect/auth', // OIDC Authorization Endpoint
    tokenURL: process.env.OIDC_TOKEN_URL || 'https://myoidcprovider.com/auth/realms/myrealm/protocol/openid-connect/token', // OIDC Token Endpoint
    // issuer is not directly supported by passport-oauth2 strategy, but the URLs should point to OIDC endpoints.
    clientID: process.env.OIDC_CLIENT_ID || 'dummy_client_id',
    clientSecret: process.env.OIDC_CLIENT_SECRET || 'dummy_client_secret',
    callbackURL: process.env.OIDC_REDIRECT_URI || "http://localhost:3000/api/auth/callback",
    scope: 'openid profile email', // OIDC scopes are crucial
    // OIDC specific parameters can sometimes be passed via params in the callback
    // or configured differently depending on the library.
  },
  async (accessToken: string, refreshToken: string | undefined, params: any, profile: OAuth2Profile, done: VerifyCallback) => { // params may contain id_token
    try {
      // For OIDC, the profile object often comes from the ID Token or UserInfo endpoint.
      // The 'sub' claim is the unique identifier. Use profile.id as fallback.
      const oidcId = profile.sub || profile.id;
      const email = profile.emails && profile.emails[0].value;
      
      if (!oidcId || !email) {
        return done(new Error("Missing required OIDC claims (sub or email)"));
      }

      let user = await UserSchema.findByEmail(email);

      if (!user) {
        user = await UserSchema.create({
          oauth_provider: 'openidconnect', // Store OIDC as provider
          oauth_id: oidcId, // Use sub claim as oauth_id
          email: email,
          display_name: profile.displayName,
        });
      } else {
        // Optionally update user info if it changed
        if (user.display_name !== profile.displayName) {
          // await UserSchema.update(user.id, { display_name: profile.displayName }); // Assuming such a method exists
        }
      }

      return done(null, user);
    } catch (error) {
      return done(error as Error);
    }
  }
));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await UserSchema.findById(id);
    if (!user) {
        return done(new Error('User not found'));
    }
    const roles = await RoleSchema.findRolesByUserId(user.id!);
    (user as any).roles = roles;
    done(null, user);
  } catch (error) {
    done(error as Error);
  }
});

export default passport;