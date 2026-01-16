/**
 * Vapi Assistant Configuration Builder
 *
 * Builds properly configured Vapi assistant configurations for auto repair quote calls.
 * Ensures all HARD REQUIREMENTS are met (ElevenLabs voice, Claude Opus 4.5 with Thinking).
 *
 * @module lib/services/vapi/assistant
 */

import type { VapiAssistantConfig } from "@/lib/types/vapi";
import type { Session, DamageSummary } from "@/lib/types/session";
import { env } from "@/lib/config/env";
import { VAPI_CONFIG } from "@/lib/config/constants";

/**
 * Formats a damage summary into a readable string for the assistant prompt.
 *
 * @param summary - Structured damage summary
 * @returns Formatted string
 */
function formatDamageSummary(summary: DamageSummary): string {
  return `${summary.description}
Severity: ${summary.severity}
Affected areas: ${summary.affected_areas.join(", ")}
Estimated repair type: ${summary.estimated_repair_type}`;
}

/**
 * Builds the system prompt for the voice assistant.
 *
 * @param damageSummary - Formatted damage summary string
 * @param vehicleInfo - Formatted vehicle info string
 * @returns Complete system prompt
 */
function buildSystemPrompt(damageSummary: string, vehicleInfo: string): string {
  return `You are a friendly customer calling an auto repair shop to get a quote.

DAMAGE DESCRIPTION:
${damageSummary}

VEHICLE INFO:
${vehicleInfo}

YOUR TASK:
1. Politely introduce yourself and explain you need a repair estimate
2. Describe the damage clearly and concisely
3. Ask for their best estimate (price range and timeframe)
4. Thank them and end the call professionally

IMPORTANT:
- Be conversational and natural
- If they ask clarifying questions, answer based on the damage description
- If they can't give an estimate over the phone, ask what information they'd need
- Keep the call under 3 minutes
- End with "Thank you for your time, goodbye" when done`;
}

/**
 * Builds a Vapi assistant configuration for auto repair quote calls.
 *
 * CRITICAL: This function ensures compliance with HARD REQUIREMENTS:
 * - Uses ONLY Claude Opus 4.5 with Thinking enabled for LLM
 * - Uses ONLY ElevenLabs for voice/TTS
 *
 * @param session - Session containing damage and vehicle information
 * @param webhookUrl - URL for Vapi to send call events
 * @returns Complete assistant configuration
 */
export function buildAssistantConfig(
  session: Session,
  webhookUrl: string
): VapiAssistantConfig {
  // Format vehicle info
  const vehicleInfo = session.vehicle
    ? `${session.vehicle.year ?? "Unknown year"} ${session.vehicle.make ?? "Unknown make"} ${session.vehicle.model ?? "Unknown model"}`
    : "Vehicle details not provided";

  // Format damage summary
  const damageSummary = session.damage_summary
    ? formatDamageSummary(session.damage_summary)
    : session.description_raw;

  // Build system prompt
  const systemPrompt = buildSystemPrompt(damageSummary, vehicleInfo);

  return {
    // Opening message when call connects
    firstMessage:
      "Hi, I'm calling to get a repair estimate for some car damage. Do you have a moment to help me?",

    // ============================================================
    // LLM CONFIGURATION — CLAUDE OPUS 4.5 WITH THINKING ONLY
    // CRITICAL: DO NOT change provider, model, or thinking settings
    // ============================================================
    model: {
      provider: VAPI_CONFIG.MODEL_PROVIDER as "anthropic",
      model: VAPI_CONFIG.MODEL_ID as "claude-opus-4-5-20251101",
      thinking: {
        type: VAPI_CONFIG.THINKING_TYPE as "enabled",
        budgetTokens: env.CLAUDE_THINKING_BUDGET_TOKENS,
      },
      messages: [{ role: "system", content: systemPrompt }],
      temperature: VAPI_CONFIG.DEFAULT_TEMPERATURE,
      maxTokens: VAPI_CONFIG.DEFAULT_MAX_TOKENS,
    },

    // ============================================================
    // VOICE CONFIGURATION — ELEVENLABS ONLY
    // CRITICAL: DO NOT change provider to anything other than "11labs"
    // ============================================================
    voice: {
      provider: VAPI_CONFIG.VOICE_PROVIDER as "11labs",
      voiceId: env.ELEVENLABS_VOICE_ID,
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0.0,
      useSpeakerBoost: true,
    },

    // Transcription configuration
    transcriber: {
      provider: "deepgram",
      language: "en-US",
    },

    // Analysis plan for extracting structured data from calls
    analysisPlan: {
      structuredDataPlan: {
        enabled: true,
        schema: {
          type: "object",
          properties: {
            quote_provided: {
              type: "boolean",
              description: "Whether a quote was provided during the call",
            },
            price_estimate_low: {
              type: "number",
              description: "Low end of price estimate in dollars",
            },
            price_estimate_high: {
              type: "number",
              description: "High end of price estimate in dollars",
            },
            timeframe_days: {
              type: "number",
              description: "Estimated repair timeframe in days",
            },
            requires_inspection: {
              type: "boolean",
              description: "Whether in-person inspection is required",
            },
            shop_can_do_work: {
              type: "boolean",
              description: "Whether the shop can perform the repair",
            },
            notes: {
              type: "string",
              description: "Additional notes from the conversation",
            },
          },
          required: ["quote_provided", "shop_can_do_work"],
        },
      },
      summaryPlan: {
        enabled: true,
      },
    },

    // Artifact plan for recordings and transcripts
    artifactPlan: {
      recordingEnabled: true,
      transcriptPlan: {
        enabled: true,
      },
    },

    // Webhook configuration
    server: {
      url: webhookUrl,
    },

    // Call constraints
    maxDurationSeconds: VAPI_CONFIG.DEFAULT_MAX_DURATION_SECONDS,

    // End call trigger phrases
    endCallPhrases: [
      "goodbye",
      "thank you for your time",
      "have a great day",
    ],
  };
}

/**
 * Gets the webhook URL for Vapi events.
 *
 * @returns Webhook URL string
 */
export function getVapiWebhookUrl(): string {
  const baseUrl = env.NEXT_PUBLIC_APP_URL || "https://autoquote.ai";
  return `${baseUrl}/api/vapi/webhook`;
}
