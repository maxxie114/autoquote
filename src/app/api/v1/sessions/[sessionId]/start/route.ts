/**
 * Session Start API Route
 *
 * Triggers the quote workflow for a session.
 *
 * @module app/api/v1/sessions/[sessionId]/start/route
 */

import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { SessionsRepository } from "@/lib/db/sessions";
import { runQuoteSessionWorkflow } from "@/lib/orchestrator/workflow";

/**
 * Route context with session ID parameter.
 */
type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

/**
 * POST /api/v1/sessions/:sessionId/start
 *
 * Starts the quote workflow for a session.
 * The session must be in CREATED status to be started.
 *
 * Response:
 * - 200: { status: "started" }
 * - 400: Invalid session status
 * - 401: Unauthorized
 * - 403: Forbidden (not owner)
 * - 404: Session not found
 * - 500: Server error
 */
export async function POST(req: NextRequest, context: RouteContext) {
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

    // Verify session can be started
    if (session.status !== "CREATED") {
      return NextResponse.json(
        {
          error: `Cannot start session in status: ${session.status}`,
          current_status: session.status,
        },
        { status: 400 }
      );
    }

    console.log(`[API] Starting workflow for session ${sessionId}`);

    // Start the workflow (runs asynchronously)
    // Don't await - let it run in background
    runQuoteSessionWorkflow(sessionId).catch((error) => {
      console.error(`[API] Workflow failed for session ${sessionId}:`, error);
    });

    return NextResponse.json({ status: "started" });
  } catch (error) {
    console.error("[API] Session start error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
