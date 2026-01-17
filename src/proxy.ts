/**
 * Next.js Proxy for Auth0 Integration
 *
 * This proxy is the central component for Auth0 SDK v4 integration.
 * It handles:
 * - Automatic mounting of authentication endpoints (/auth/login, /auth/logout, etc.)
 * - Rolling session management
 * - Access token refresh
 * - Graceful handling of corrupted/invalid session cookies (ERR_JWE_INVALID)
 *
 * The proxy runs on every request that matches the configured paths.
 *
 * @module proxy
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

/**
 * Cookie names used by Auth0 SDK v4 for session management.
 * These are cleared when a JWE decryption error occurs.
 */
const AUTH0_COOKIE_NAMES = [
  "__session",
  "appSession",
  "appSession.0",
  "appSession.1",
  "appSession.2",
  "appSession.sig",
] as const;

/**
 * Checks if an error is an Auth0 JWE decryption error.
 * These errors occur when session cookies were encrypted with a different
 * AUTH0_SECRET or are otherwise corrupted/malformed.
 *
 * @param error - The error to check
 * @returns True if the error is a JWE-related decryption error
 */
function isJweDecryptionError(error: unknown): boolean {
  if (error instanceof Error) {
    // Check for Auth0 SDK JWE error codes
    const errorWithCode = error as Error & { code?: string };
    if (
      errorWithCode.code === "ERR_JWE_INVALID" ||
      errorWithCode.code === "ERR_JWE_DECRYPTION_FAILED" ||
      errorWithCode.code === "ERR_JWS_INVALID" ||
      errorWithCode.code === "ERR_JWS_SIGNATURE_VERIFICATION_FAILED"
    ) {
      return true;
    }
    // Also check error message for JWE-related keywords
    const message = error.message.toLowerCase();
    if (
      message.includes("jwe") ||
      message.includes("compact jwe") ||
      message.includes("decryption") ||
      message.includes("invalid session")
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Creates a response that clears all Auth0 session cookies.
 * This is used when JWE decryption fails to reset the client's session state.
 *
 * @param request - The incoming request
 * @param redirectToLogin - Whether to redirect to login page
 * @returns NextResponse with cookies cleared
 */
function createClearCookiesResponse(
  request: NextRequest,
  redirectToLogin: boolean = false
): NextResponse {
  const { origin } = new URL(request.url);

  let response: NextResponse;
  if (redirectToLogin) {
    const returnTo = encodeURIComponent(request.nextUrl.pathname);
    response = NextResponse.redirect(`${origin}/auth/login?returnTo=${returnTo}`);
  } else {
    response = NextResponse.next();
  }

  // Clear all Auth0 session cookies to reset the invalid session state
  for (const cookieName of AUTH0_COOKIE_NAMES) {
    response.cookies.delete(cookieName);
  }

  console.warn(
    `[Auth0 Proxy] Cleared invalid session cookies for request: ${request.nextUrl.pathname}`
  );

  return response;
}

/**
 * Main proxy function that handles authentication.
 *
 * This function passes all requests through the Auth0 middleware handler,
 * which automatically:
 * - Mounts authentication routes (/auth/login, /auth/logout, /auth/callback, /auth/profile)
 * - Manages session cookies
 * - Handles rolling sessions
 *
 * Additionally, this proxy gracefully handles JWE decryption errors
 * (ERR_JWE_INVALID) that occur when session cookies are corrupted or were
 * encrypted with a different AUTH0_SECRET. When such errors occur, the
 * invalid cookies are automatically cleared, allowing the user to re-authenticate.
 *
 * @param request - The incoming Next.js request object
 * @returns A NextResponse object, either from Auth0 or with authentication checks
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  let authRes: NextResponse;

  try {
    // Pass all requests through Auth0 middleware
    // This handles authentication routes and session management
    authRes = await auth0.middleware(request);
  } catch (error) {
    // Handle JWE decryption errors gracefully by clearing invalid cookies
    if (isJweDecryptionError(error)) {
      console.warn(
        "[Auth0 Proxy] JWE decryption failed - clearing invalid session cookies.",
        error instanceof Error ? error.message : String(error)
      );

      // For auth routes, clear cookies and let them proceed (will trigger fresh login)
      if (request.nextUrl.pathname.startsWith("/auth")) {
        return createClearCookiesResponse(request, false);
      }

      // For protected routes, clear cookies and redirect to login
      if (request.nextUrl.pathname.startsWith("/session")) {
        return createClearCookiesResponse(request, true);
      }

      // For other routes, just clear cookies and continue
      return createClearCookiesResponse(request, false);
    }

    // Re-throw non-JWE errors
    throw error;
  }

  // Let Auth0 handle its own routes without interference
  if (request.nextUrl.pathname.startsWith("/auth")) {
    return authRes;
  }

  // Public routes that don't require authentication
  const publicPaths = ["/", "/api/vapi/webhook", "/api/webhooks"];
  const isPublicPath = publicPaths.some(
    (path) =>
      request.nextUrl.pathname === path ||
      request.nextUrl.pathname.startsWith("/api/vapi") ||
      request.nextUrl.pathname.startsWith("/api/webhooks")
  );

  if (isPublicPath) {
    return authRes;
  }

  // Protected API routes
  if (request.nextUrl.pathname.startsWith("/api/v1")) {
    // API routes handle their own authentication via getSession()
    // Just pass through the auth response
    return authRes;
  }

  // Protected page routes (session pages)
  if (request.nextUrl.pathname.startsWith("/session")) {
    try {
      const session = await auth0.getSession(request);

      if (!session) {
        const { origin } = new URL(request.url);
        const returnTo = encodeURIComponent(request.nextUrl.pathname);
        return NextResponse.redirect(`${origin}/auth/login?returnTo=${returnTo}`);
      }
    } catch (error) {
      // Handle JWE errors during session retrieval
      if (isJweDecryptionError(error)) {
        console.warn(
          "[Auth0 Proxy] JWE decryption failed during session check - redirecting to login.",
          error instanceof Error ? error.message : String(error)
        );
        return createClearCookiesResponse(request, true);
      }
      throw error;
    }
  }

  return authRes;
}

/**
 * Proxy configuration specifying which paths to run the proxy on.
 *
 * Excludes:
 * - Static files (_next/static)
 * - Image optimization files (_next/image)
 * - Metadata files (favicon.ico, sitemap.xml, robots.txt)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
