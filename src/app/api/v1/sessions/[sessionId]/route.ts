/**
 * Session Detail API Route
 *
 * Handles individual session retrieval.
 *
 * @module app/api/v1/sessions/[sessionId]/route
 */

import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { SessionsRepository } from "@/lib/db/sessions";

/**
 * Route context with session ID parameter.
 */
type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

/**
 * GET /api/v1/sessions/:sessionId
 *
 * Retrieves a session by ID.
 *
 * Response:
 * - 200: Session object
 * - 401: Unauthorized
 * - 403: Forbidden (not owner)
 * - 404: Session not found
 * - 500: Server error
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    // Verify authentication using Auth0 SDK v4
    const authSession = await auth0.getSession();
    if (!authSession?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get session ID from params
    const { sessionId } = await context.params;

    // Fetch session
    const session = await SessionsRepository.get(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (session.user_id !== authSession.user.sub) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("[API] Session fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
