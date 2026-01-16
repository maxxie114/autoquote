/**
 * Session Calls API Route
 *
 * Handles retrieval of call records for a session.
 *
 * @module app/api/v1/sessions/[sessionId]/calls/route
 */

import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { SessionsRepository } from "@/lib/db/sessions";
import { CallsRepository } from "@/lib/db/calls";

/**
 * Route context with session ID parameter.
 */
type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

/**
 * GET /api/v1/sessions/:sessionId/calls
 *
 * Retrieves all call records for a session.
 *
 * Response:
 * - 200: Call[] array
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

    // Verify session exists and user owns it
    const session = await SessionsRepository.get(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (session.user_id !== authSession.user.sub) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Fetch calls for session
    const calls = await CallsRepository.getBySession(sessionId);

    return NextResponse.json(calls);
  } catch (error) {
    console.error("[API] Session calls fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
