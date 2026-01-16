/**
 * Mastra Workflow Definition
 *
 * Defines the main quote session workflow using Mastra orchestration.
 * This workflow handles the full lifecycle from session analysis to call initiation.
 *
 * @module lib/orchestrator/workflow
 */

import { Mastra } from "@mastra/core";
import { SessionsRepository } from "@/lib/db/sessions";
import { CallsRepository } from "@/lib/db/calls";
import { OpenRouterService } from "@/lib/services/openrouter";
import { FreepikService } from "@/lib/services/freepik";
import { VapiClient, buildAssistantConfig, getVapiWebhookUrl } from "@/lib/services/vapi";
import { S3Service } from "@/lib/services/s3";
import { enforceDemoMode, areCallsAllowed } from "@/lib/demo/enforcement";

/**
 * Main workflow execution function.
 * Runs the quote session workflow synchronously through each phase.
 *
 * @param sessionId - Session ID to process
 */
export async function runQuoteSessionWorkflow(sessionId: string): Promise<void> {
  console.log(`[Workflow] Starting workflow for session ${sessionId}`);

  const session = await SessionsRepository.get(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  if (session.status !== "CREATED") {
    throw new Error(`Cannot start workflow for session in status: ${session.status}`);
  }

  try {
    // ================================================================
    // Phase 1: ANALYZING - Generate damage summary
    // ================================================================
    console.log(`[Workflow] Session ${sessionId}: Entering ANALYZING phase`);
    await SessionsRepository.updateStatus(sessionId, "ANALYZING");

    // Get image prompt if we have images but no prompt yet
    const imagePrompt = session.image_prompt;
    if (session.image_keys?.length && !imagePrompt) {
      console.log(`[Workflow] Session ${sessionId}: Processing image`);
      const imageUrl = await S3Service.getSignedReadUrl(session.image_keys[0]);
      
      // Start async Freepik task - workflow will be resumed by webhook
      await FreepikService.createImageToPromptTask(imageUrl, sessionId);
      
      // For now, continue without waiting for image prompt
      // The image prompt will be used if available when generating damage summary
      console.log(`[Workflow] Session ${sessionId}: Image task submitted, continuing without image prompt`);
    }

    // Refresh session to get any updates
    const refreshedSession = await SessionsRepository.getOrThrow(sessionId);

    // Generate damage summary
    console.log(`[Workflow] Session ${sessionId}: Generating damage summary`);
    const damageSummary = await OpenRouterService.generateDamageSummary(
      refreshedSession.description_raw,
      refreshedSession.image_prompt,
      refreshedSession.vehicle
    );

    await SessionsRepository.update(sessionId, { damage_summary: damageSummary });
    console.log(`[Workflow] Session ${sessionId}: Damage summary generated`);

    // ================================================================
    // Phase 2: CALLING - Initiate calls to shops
    // ================================================================
    console.log(`[Workflow] Session ${sessionId}: Entering CALLING phase`);
    await SessionsRepository.updateStatus(sessionId, "CALLING");

    // Check if calls are allowed
    if (!areCallsAllowed()) {
      console.warn(`[Workflow] Session ${sessionId}: Outbound calls disabled, skipping call phase`);
      await SessionsRepository.updateStatus(sessionId, "SUMMARIZING");
      await SessionsRepository.updateStatus(sessionId, "DONE");
      return;
    }

    // Get updated session with damage summary
    const sessionWithSummary = await SessionsRepository.getOrThrow(sessionId);
    const webhookUrl = getVapiWebhookUrl();
    const assistantConfig = buildAssistantConfig(sessionWithSummary, webhookUrl);

    console.log(`[Workflow] Session ${sessionId}: Initiating ${sessionWithSummary.shops.length} calls`);

    // Initiate calls to all shops
    for (const shop of sessionWithSummary.shops) {
      try {
        // Get the actual number to dial (enforces DEMO_MODE)
        const targetNumber = enforceDemoMode(shop.phone);

        // Create call record
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

        // Update call record
        await CallsRepository.update(sessionId, shop.id, {
          vapi_call_id: response.id,
          status: "IN_PROGRESS",
        });

        console.log(`[Workflow] Session ${sessionId}: Call initiated to ${shop.name}`);
      } catch (error) {
        console.error(`[Workflow] Session ${sessionId}: Failed to call ${shop.name}:`, error);
        
        // Mark call as failed but continue with other shops
        try {
          await CallsRepository.update(sessionId, shop.id, {
            status: "FAILED",
            ended_reason: error instanceof Error ? error.message : "Unknown error",
          });
        } catch {
          // Call record may not exist yet, create it as failed
          await CallsRepository.create({
            session_id: sessionId,
            shop_id: shop.id,
            to_number: shop.phone,
            status: "FAILED",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }
    }

    console.log(`[Workflow] Session ${sessionId}: All calls initiated, waiting for completions via webhooks`);

    // ================================================================
    // Phases 3 & 4 (SUMMARIZING & DONE) are handled by webhook callbacks
    // See state-machine.ts checkSessionCompletion()
    // ================================================================

  } catch (error) {
    console.error(`[Workflow] Session ${sessionId}: Workflow failed:`, error);
    await SessionsRepository.updateStatus(sessionId, "FAILED");
    throw error;
  }
}

/**
 * Initialize Mastra with workflow configuration.
 * Note: This creates a Mastra instance but we primarily use the runQuoteSessionWorkflow
 * function directly for simpler execution flow.
 */
export const mastra = new Mastra({
  // Mastra configuration
  // Workflows are executed via runQuoteSessionWorkflow for this implementation
});

/**
 * Gets the Mastra instance.
 */
export function getMastraInstance(): Mastra {
  return mastra;
}
