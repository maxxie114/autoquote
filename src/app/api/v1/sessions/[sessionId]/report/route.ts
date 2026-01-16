/**
 * Session Report API Route
 *
 * Handles retrieval of the final comparison report.
 *
 * @module app/api/v1/sessions/[sessionId]/report/route
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
 * GET /api/v1/sessions/:sessionId/report
 *
 * Retrieves the final comparison report for a session.
 * The session must be in DONE status to have a report.
 *
 * Response:
 * - 200: Report object
 * - 400: Report not ready (session not DONE)
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

    // Check if report is available
    if (session.status !== "DONE") {
      return NextResponse.json(
        {
          error: "Report not ready",
          current_status: session.status,
          message: session.status === "FAILED"
            ? "Session failed. Please try again."
            : "Please wait for the session to complete.",
        },
        { status: 400 }
      );
    }

    if (!session.report) {
      return NextResponse.json(
        { error: "Report not available" },
        { status: 404 }
      );
    }

    return NextResponse.json(session.report);
  } catch (error) {
    console.error("[API] Session report fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
