/**
 * Auth0 Client Configuration Module
 *
 * This module creates and exports the Auth0 client instance for use throughout
 * the application. The Auth0 SDK v4 uses a centralized client approach where
 * all authentication operations are performed through this single instance.
 *
 * @module lib/auth0
 */

import { Auth0Client } from "@auth0/nextjs-auth0/server";

/**
 * Auth0 Client Instance
 *
 * The centralized Auth0 client used for all authentication operations including:
 * - Session management (getSession, getAccessToken)
 * - Middleware authentication handling
 * - Route protection
 *
 * Configuration is automatically loaded from environment variables:
 * - AUTH0_DOMAIN: The Auth0 tenant domain (e.g., 'example.us.auth0.com')
 * - AUTH0_CLIENT_ID: The Auth0 application client ID
 * - AUTH0_CLIENT_SECRET: The Auth0 application client secret
 * - AUTH0_SECRET: A long, random string used to encrypt the session cookie
 * - APP_BASE_URL: The application's base URL (e.g., 'http://localhost:3000')
 *
 * @example
 * ```typescript
 * import { auth0 } from '@/lib/auth0';
 *
 * // In a Server Component
 * const session = await auth0.getSession();
 *
 * // In middleware
 * const authRes = await auth0.middleware(request);
 * ```
 */
export const auth0 = new Auth0Client({
  // Optional: Customize authorization parameters
  authorizationParameters: {
    scope: "openid profile email",
  },
});
