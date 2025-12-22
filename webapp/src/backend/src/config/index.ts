import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const PORT = process.env.PORT || 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const DATABASE_URL = process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/multigo';

// OpenID Connect Configuration
export const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID || 'your-client-id';
export const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET || 'your-client-secret';
export const OIDC_ISSUER_URL = process.env.OIDC_ISSUER_URL || 'https://accounts.google.com'; // Example for Google
export const OIDC_REDIRECT_URI = process.env.OIDC_REDIRECT_URI || 'http://localhost:3000/auth/openid/callback';
export const SESSION_SECRET = process.env.SESSION_SECRET || 'supersecretkey'; // Change in production!
