/**
 * Vapi Assistant Configuration Validation
 *
 * CRITICAL SAFETY MODULE - Validates that assistant configurations meet
 * ALL HARD REQUIREMENTS specified in the AutoQuote AI spec.
 *
 * HARD REQUIREMENTS:
 * 1. Voice provider MUST be "11labs" (ElevenLabs)
 * 2. Model provider MUST be "anthropic"
 * 3. Model MUST be "claude-opus-4-5-20251101" (Claude Opus 4.5)
 * 4. Thinking MUST be enabled with valid budgetTokens
 *
 * @module lib/services/vapi/validation
 */

import type { VapiAssistantConfig } from "@/lib/types/vapi";
import { SpecViolationError } from "@/lib/utils/errors";
import { VAPI_CONFIG } from "@/lib/config/constants";

/**
 * Validates that the assistant configuration meets ALL HARD REQUIREMENTS.
 *
 * CRITICAL: This function MUST be called before creating any Vapi call.
 *
 * @param config - The assistant configuration to validate
 * @throws SpecViolationError if any hard requirement is violated
 */
export function validateAssistantConfig(config: VapiAssistantConfig): void {
  // ============================================================
  // HARD REQUIREMENT 1: ElevenLabs ONLY for voice
  // ============================================================
  if (config.voice.provider !== VAPI_CONFIG.VOICE_PROVIDER) {
    throw new SpecViolationError(
      `Voice provider must be "${VAPI_CONFIG.VOICE_PROVIDER}" (ElevenLabs). ` +
        `Other voice providers (Azure, PlayHT, Deepgram, Cartesia, etc.) are FORBIDDEN`,
      `"${config.voice.provider}"`
    );
  }

  // ============================================================
  // HARD REQUIREMENT 2: Anthropic provider ONLY
  // ============================================================
  if (config.model.provider !== VAPI_CONFIG.MODEL_PROVIDER) {
    throw new SpecViolationError(
      `Model provider must be "${VAPI_CONFIG.MODEL_PROVIDER}". ` +
        `Other LLM providers (OpenAI, Google, etc.) are FORBIDDEN`,
      `"${config.model.provider}"`
    );
  }

  // ============================================================
  // HARD REQUIREMENT 3: Claude Opus 4.5 ONLY (no Sonnet, Haiku, old Opus)
  // ============================================================
  if (config.model.model !== VAPI_CONFIG.MODEL_ID) {
    throw new SpecViolationError(
      `Model must be "${VAPI_CONFIG.MODEL_ID}" (Claude Opus 4.5). ` +
        `Other models (Sonnet, Haiku, old Opus, GPT, Gemini, etc.) are FORBIDDEN`,
      `"${config.model.model}"`
    );
  }

  // ============================================================
  // HARD REQUIREMENT 4: Thinking MUST be enabled
  // ============================================================
  if (!config.model.thinking || config.model.thinking.type !== VAPI_CONFIG.THINKING_TYPE) {
    throw new SpecViolationError(
      `Thinking must be enabled for Claude Opus 4.5. ` +
        `Set thinking.type to "${VAPI_CONFIG.THINKING_TYPE}" with a budgetTokens value`,
      JSON.stringify(config.model.thinking)
    );
  }

  // Validate budgetTokens is a positive number
  if (
    typeof config.model.thinking.budgetTokens !== "number" ||
    config.model.thinking.budgetTokens <= 0
  ) {
    throw new SpecViolationError(
      `thinking.budgetTokens must be a positive number`,
      String(config.model.thinking.budgetTokens)
    );
  }

  console.log(
    "✓ Assistant config validated: ElevenLabs voice + Claude Opus 4.5 (Thinking enabled)"
  );
}

/**
 * Validates a voice provider string.
 *
 * @param provider - Voice provider string to validate
 * @returns True if provider is ElevenLabs ("11labs")
 */
export function isValidVoiceProvider(provider: string): provider is "11labs" {
  return provider === VAPI_CONFIG.VOICE_PROVIDER;
}

/**
 * Validates a model provider string.
 *
 * @param provider - Model provider string to validate
 * @returns True if provider is Anthropic
 */
export function isValidModelProvider(provider: string): provider is "anthropic" {
  return provider === VAPI_CONFIG.MODEL_PROVIDER;
}

/**
 * Validates a model ID string.
 *
 * @param model - Model ID string to validate
 * @returns True if model is Claude Opus 4.5
 */
export function isValidModel(
  model: string
): model is "claude-opus-4-5-20251101" {
  return model === VAPI_CONFIG.MODEL_ID;
}
