/**
 * Next.js Middleware for Auth0 Integration
 *
 * This middleware is the central component for Auth0 SDK v4 integration.
 * It handles:
 * - Automatic mounting of authentication endpoints (/auth/login, /auth/logout, etc.)
 * - Rolling session management
 * - Access token refresh
 *
 * The middleware runs on every request that matches the configured paths.
 *
 * @module middleware
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

/**
 * Main middleware function that handles authentication.
 *
 * This function passes all requests through the Auth0 middleware handler,
 * which automatically:
 * - Mounts authentication routes (/auth/login, /auth/logout, /auth/callback, /auth/profile)
 * - Manages session cookies
 * - Handles rolling sessions
 *
 * @param request - The incoming Next.js request object
 * @returns A NextResponse object, either from Auth0 or with authentication checks
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  // Pass all requests through Auth0 middleware
  // This handles authentication routes and session management
  const authRes = await auth0.middleware(request);

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
    const session = await auth0.getSession(request);

    if (!session) {
      const { origin } = new URL(request.url);
      const returnTo = encodeURIComponent(request.nextUrl.pathname);
      return NextResponse.redirect(`${origin}/auth/login?returnTo=${returnTo}`);
    }
  }

  return authRes;
}

/**
 * Middleware configuration specifying which paths to run the middleware on.
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
