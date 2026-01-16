/**
 * Vapi Webhook Handler
 *
 * Receives and processes webhook events from Vapi for call status updates.
 * Updates call records in DynamoDB and triggers report generation when all calls complete.
 *
 * @module app/api/vapi/webhook/route
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { env } from "@/lib/config/env";
import { CallsRepository } from "@/lib/db/calls";
import { checkSessionCompletion } from "@/lib/orchestrator/state-machine";
import type { VapiWebhookEvent } from "@/lib/types/vapi";

/**
 * POST /api/vapi/webhook
 *
 * Handles Vapi webhook events.
 *
 * Events handled:
 * - call.started: Updates call status to IN_PROGRESS
 * - call.ended: Updates call with transcript, analysis, and status COMPLETED
 * - call.failed: Updates call status to FAILED
 *
 * Response:
 * - 200: { received: true }
 * - 400: Missing metadata
 * - 401: Invalid signature
 * - 500: Server error
 */
export async function POST(req: NextRequest) {
  try {
    // Read body as text for signature verification
    const bodyText = await req.text();

    // Validate webhook signature if present
    const signature = req.headers.get("x-vapi-signature");
    if (signature) {
      const expectedSignature = crypto
        .createHmac("sha256", env.VAPI_WEBHOOK_SECRET)
        .update(bodyText)
        .digest("hex");

      if (signature !== expectedSignature) {
        console.error("[Vapi Webhook] Invalid signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    // Parse event
    const event = JSON.parse(bodyText) as VapiWebhookEvent;

    console.log(`[Vapi Webhook] Received event: ${event.type}`);

    // Extract metadata for session/shop correlation
    const metadata = event.assistant?.metadata;

    if (!metadata?.session_id || !metadata?.shop_id) {
      console.error("[Vapi Webhook] Missing required metadata:", event.type);
      // Return 200 to prevent Vapi from retrying events we can't process
      return NextResponse.json({ received: true, warning: "Missing metadata" });
    }

    const { session_id, shop_id, shop_name } = metadata;

    // Handle event types
    switch (event.type) {
      case "call.started":
        console.log(
          `[Vapi Webhook] Call started: session=${session_id}, shop=${shop_name}`
        );
        await CallsRepository.update(session_id, shop_id, {
          status: "IN_PROGRESS",
          vapi_call_id: event.call?.id,
        });
        break;

      case "call.ended":
        console.log(
          `[Vapi Webhook] Call ended: session=${session_id}, shop=${shop_name}`
        );
        const call = event.call;

        // Calculate duration from messages if available
        let durationSeconds: number | undefined;
        if (call?.artifact?.messages && call.artifact.messages.length >= 2) {
          const messages = call.artifact.messages;
          const firstTime = messages[0].time;
          const lastTime = messages[messages.length - 1].time;
          durationSeconds = Math.round((lastTime - firstTime) / 1000);
        }

        await CallsRepository.update(session_id, shop_id, {
          status: "COMPLETED",
          transcript: call?.artifact?.transcript,
          structured_data: call?.analysis?.structuredData,
          summary: call?.analysis?.summary,
          cost: call?.cost,
          duration_seconds: durationSeconds,
          ended_reason: call?.endedReason,
          recording_url: call?.artifact?.recordingUrl,
        });

        // Check if all calls are complete and trigger report generation
        await checkSessionCompletion(session_id);
        break;

      case "call.failed":
        console.log(
          `[Vapi Webhook] Call failed: session=${session_id}, shop=${shop_name}, reason=${event.call?.endedReason}`
        );
        await CallsRepository.update(session_id, shop_id, {
          status: "FAILED",
          ended_reason: event.call?.endedReason || "Unknown failure",
        });

        // Check completion even on failure (failure counts as complete)
        await checkSessionCompletion(session_id);
        break;

      case "status-update":
        // Log but don't process intermediate status updates
        console.log(
          `[Vapi Webhook] Status update: session=${session_id}, shop=${shop_name}`
        );
        break;

      default:
        console.log(`[Vapi Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Vapi Webhook] Error processing event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/vapi/webhook
 *
 * Health check endpoint for webhook verification.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "vapi-webhook",
    timestamp: new Date().toISOString(),
  });
}
