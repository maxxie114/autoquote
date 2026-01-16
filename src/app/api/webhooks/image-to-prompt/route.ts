/**
 * Freepik Image-to-Prompt Webhook Handler
 *
 * Receives completion callbacks from Freepik's async image-to-prompt API.
 * Updates the session with the generated image description.
 *
 * @module app/api/webhooks/image-to-prompt/route
 */

import { NextRequest, NextResponse } from "next/server";
import { SessionsRepository } from "@/lib/db/sessions";
import { resumeAfterImagePrompt } from "@/lib/orchestrator/state-machine";

/**
 * Expected Freepik webhook payload structure.
 */
type FreepikWebhookPayload = {
  /** Task ID */
  task_id: string;
  /** Task status */
  status: "PENDING" | "COMPLETED" | "FAILED";
  /** Result when completed */
  result?: {
    /** Generated prompt/description */
    prompt: string;
  };
  /** Error message if failed */
  error?: string;
};

/**
 * POST /api/webhooks/image-to-prompt
 *
 * Handles Freepik image-to-prompt completion callbacks.
 *
 * Query parameters:
 * - session_id: string - Session ID for correlation
 *
 * Request body:
 * - task_id: string
 * - status: "PENDING" | "COMPLETED" | "FAILED"
 * - result?: { prompt: string }
 * - error?: string
 *
 * Response:
 * - 200: { received: true }
 * - 400: Missing session_id
 * - 500: Server error
 */
export async function POST(req: NextRequest) {
  try {
    // Get session ID from query params
    const sessionId = req.nextUrl.searchParams.get("session_id");

    if (!sessionId) {
      console.error("[Freepik Webhook] Missing session_id parameter");
      return NextResponse.json(
        { error: "Missing session_id parameter" },
        { status: 400 }
      );
    }

    // Parse webhook payload
    const body = (await req.json()) as FreepikWebhookPayload;

    console.log(
      `[Freepik Webhook] Received: session=${sessionId}, status=${body.status}`
    );

    // Handle based on status
    switch (body.status) {
      case "COMPLETED":
        if (body.result?.prompt) {
          console.log(
            `[Freepik Webhook] Image prompt received for session ${sessionId}`
          );

          // Update session with image prompt
          await SessionsRepository.update(sessionId, {
            image_prompt: body.result.prompt,
          });

          // Resume workflow if it was waiting for the image prompt
          await resumeAfterImagePrompt(sessionId, body.result.prompt);
        } else {
          console.warn(
            `[Freepik Webhook] Completed but no prompt for session ${sessionId}`
          );
        }
        break;

      case "FAILED":
        console.error(
          `[Freepik Webhook] Task failed for session ${sessionId}: ${body.error}`
        );
        // Don't fail the session - the workflow can continue without image analysis
        break;

      case "PENDING":
        console.log(
          `[Freepik Webhook] Task still pending for session ${sessionId}`
        );
        break;

      default:
        console.log(
          `[Freepik Webhook] Unknown status for session ${sessionId}: ${body.status}`
        );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Freepik Webhook] Error processing event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/image-to-prompt
 *
 * Health check endpoint for webhook verification.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "freepik-webhook",
    timestamp: new Date().toISOString(),
  });
}
