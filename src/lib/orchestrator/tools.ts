/**
 * Mastra Tool Wrappers
 *
 * Defines tool wrappers for use in Mastra workflows.
 * Each tool wraps an external service call with proper typing and error handling.
 *
 * Note: Mastra v0.24.9 API - execute function receives (context, options?) where
 * the input data is accessed via context.context property.
 *
 * @module lib/orchestrator/tools
 */

import { createTool } from "@mastra/core";
import { z } from "zod";
import { SessionsRepository } from "@/lib/db/sessions";
import { CallsRepository } from "@/lib/db/calls";
import { OpenRouterService } from "@/lib/services/openrouter";
import { FreepikService } from "@/lib/services/freepik";
import { VapiClient, buildAssistantConfig, getVapiWebhookUrl } from "@/lib/services/vapi";
import { S3Service } from "@/lib/services/s3";
import { enforceDemoMode, areCallsAllowed } from "@/lib/demo/enforcement";
import type { SessionStatus } from "@/lib/types/session";

/**
 * Tool for updating session status in DynamoDB.
 */
export const updateSessionStatusTool = createTool({
  id: "updateSessionStatus",
  description: "Updates the session status in DynamoDB",
  inputSchema: z.object({
    sessionId: z.string().describe("Session ID to update"),
    status: z
      .enum(["CREATED", "ANALYZING", "CALLING", "SUMMARIZING", "DONE", "FAILED"])
      .describe("New status value"),
  }),
  execute: async (ctx) => {
    // In Mastra v0.24.x, input is accessed via ctx.context
    const { sessionId, status } = ctx.context;
    await SessionsRepository.updateStatus(sessionId, status as SessionStatus);
    console.log(`[Workflow] Session ${sessionId} status updated to ${status}`);
    return { success: true, status };
  },
});

/**
 * Tool for generating damage summary using Claude.
 */
export const generateDamageSummaryTool = createTool({
  id: "generateDamageSummary",
  description: "Generates structured damage summary using Claude via OpenRouter",
  inputSchema: z.object({
    sessionId: z.string().describe("Session ID to process"),
  }),
  execute: async (ctx) => {
    const { sessionId } = ctx.context;
    const session = await SessionsRepository.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Check if we need to get image description first
    const imagePrompt = session.image_prompt;
    if (session.image_keys?.length && !imagePrompt) {
      console.log(`[Workflow] Session ${sessionId}: Getting image description from Freepik`);
      const imageUrl = await S3Service.getSignedReadUrl(session.image_keys[0]);
      await FreepikService.createImageToPromptTask(imageUrl, sessionId);
      // Freepik result comes via webhook, workflow will need to be resumed
      return { pending: true, reason: "awaiting_image_prompt" };
    }

    console.log(`[Workflow] Session ${sessionId}: Generating damage summary with Claude`);
    const summary = await OpenRouterService.generateDamageSummary(
      session.description_raw,
      imagePrompt,
      session.vehicle
    );

    await SessionsRepository.update(sessionId, { damage_summary: summary });
    console.log(`[Workflow] Session ${sessionId}: Damage summary generated`);

    return { success: true, summary };
  },
});

/**
 * Tool for initiating Vapi calls to all shops.
 */
export const initiateCallsTool = createTool({
  id: "initiateCalls",
  description: "Creates Vapi outbound calls to all shops for a session",
  inputSchema: z.object({
    sessionId: z.string().describe("Session ID to process"),
  }),
  execute: async (ctx) => {
    const { sessionId } = ctx.context;

    // Check if calls are allowed
    if (!areCallsAllowed()) {
      throw new Error("Outbound calls are disabled (ALLOW_OUTBOUND_CALLS=false)");
    }

    const session = await SessionsRepository.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const webhookUrl = getVapiWebhookUrl();
    const assistantConfig = buildAssistantConfig(session, webhookUrl);

    console.log(
      `[Workflow] Session ${sessionId}: Initiating ${session.shops.length} calls`
    );

    const results = [];

    for (const shop of session.shops) {
      try {
        // Get the actual number to dial (enforces DEMO_MODE)
        const targetNumber = enforceDemoMode(shop.phone);

        // Create call record in DynamoDB first
        await CallsRepository.create({
          session_id: sessionId,
          shop_id: shop.id,
          to_number: targetNumber,
          status: "PENDING",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        // Initiate Vapi call
        const response = await VapiClient.createCall(
          sessionId,
          shop,
          assistantConfig
        );

        // Update call record with Vapi call ID
        await CallsRepository.update(sessionId, shop.id, {
          vapi_call_id: response.id,
          status: "IN_PROGRESS",
        });

        console.log(
          `[Workflow] Session ${sessionId}: Call initiated to ${shop.name} (${targetNumber})`
        );
        results.push({ shopId: shop.id, callId: response.id, success: true });
      } catch (error) {
        console.error(
          `[Workflow] Session ${sessionId}: Failed to call ${shop.name}:`,
          error
        );

        // Update call record as failed
        await CallsRepository.update(sessionId, shop.id, {
          status: "FAILED",
          ended_reason:
            error instanceof Error ? error.message : "Unknown error",
        });

        results.push({
          shopId: shop.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(
      `[Workflow] Session ${sessionId}: ${successCount}/${results.length} calls initiated`
    );

    return { success: true, callCount: successCount, results };
  },
});

/**
 * Tool for checking if all calls are complete.
 */
export const checkCallsCompleteTool = createTool({
  id: "checkCallsComplete",
  description: "Checks if all calls for a session are complete",
  inputSchema: z.object({
    sessionId: z.string().describe("Session ID to check"),
  }),
  execute: async (ctx) => {
    const { sessionId } = ctx.context;
    const calls = await CallsRepository.getBySession(sessionId);
    const allComplete = calls.every((c) =>
      ["COMPLETED", "FAILED"].includes(c.status)
    );

    const completedCount = calls.filter((c) => c.status === "COMPLETED").length;
    const failedCount = calls.filter((c) => c.status === "FAILED").length;

    return {
      allComplete,
      total: calls.length,
      completed: completedCount,
      failed: failedCount,
      inProgress: calls.length - completedCount - failedCount,
    };
  },
});
