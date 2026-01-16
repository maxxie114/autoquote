/**
 * OpenRouter Service
 *
 * Client for calling Claude Opus 4.5 via OpenRouter with optional extended thinking.
 * Used for damage summary generation and report synthesis.
 *
 * The client is lazy-loaded to prevent errors during build time when
 * environment variables are not available.
 *
 * @module lib/services/openrouter
 */

import OpenAI from "openai";
import { env } from "@/lib/config/env";
import type { DamageSummary, Vehicle } from "@/lib/types/session";
import { ExternalServiceError } from "@/lib/utils/errors";

/**
 * Cached OpenRouter client instance.
 */
let _openrouter: OpenAI | undefined;

/**
 * Gets or creates the OpenRouter client instance.
 * Uses lazy initialization to prevent errors during build.
 *
 * @returns OpenAI client configured for OpenRouter
 */
function getClient(): OpenAI {
  if (_openrouter) {
    return _openrouter;
  }

  _openrouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: env.OPENROUTER_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": "https://autoquote.ai",
      "X-Title": "AutoQuote AI",
    },
  });

  return _openrouter;
}

/**
 * Configuration for Claude's extended thinking feature.
 */
export type ThinkingConfig = {
  /** Whether thinking is enabled */
  enabled: boolean;
  /** Token budget for reasoning (optional, uses env default if not specified) */
  budgetTokens?: number;
};

/**
 * Chat message format for Claude.
 */
export type ClaudeMessage = {
  /** Message role */
  role: "system" | "user" | "assistant";
  /** Message content */
  content: string;
};

/**
 * Options for chat completion calls.
 */
export type ChatOptions = {
  /** Extended thinking configuration */
  thinking?: ThinkingConfig;
  /** Enable JSON mode for structured outputs */
  jsonMode?: boolean;
  /** Maximum tokens in response */
  maxTokens?: number;
};

/**
 * OpenRouter service for Claude API interactions.
 */
export const OpenRouterService = {
  /**
   * Calls Claude Opus 4.5 via OpenRouter with optional extended thinking.
   *
   * @param messages - Chat messages to send
   * @param options - Configuration options
   * @returns Claude's response content as a string
   * @throws ExternalServiceError if the API call fails
   */
  async chat(messages: ClaudeMessage[], options: ChatOptions = {}): Promise<string> {
    const { thinking, jsonMode, maxTokens = 4096 } = options;
    const openrouter = getClient();

    try {
      const response = await openrouter.chat.completions.create({
        model: env.OPENROUTER_MODEL,
        messages,
        max_tokens: maxTokens,
        response_format: jsonMode ? { type: "json_object" } : undefined,
        // Extended thinking via Anthropic-specific params
        ...(thinking?.enabled && {
          extra_body: {
            thinking: {
              type: "enabled",
              budget_tokens: thinking.budgetTokens ?? env.CLAUDE_THINKING_BUDGET_TOKENS,
            },
          },
        }),
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Claude returned empty response");
      }

      return content;
    } catch (error) {
      throw new ExternalServiceError(
        "OpenRouter",
        error instanceof Error ? error.message : "Unknown error",
        error
      );
    }
  },

  /**
   * Generates a structured damage summary from user input.
   * Uses extended thinking for better analysis.
   *
   * @param descriptionRaw - User's raw damage description
   * @param imagePrompt - Optional text from Freepik image analysis
   * @param vehicle - Optional vehicle information
   * @returns Structured damage summary
   */
  async generateDamageSummary(
    descriptionRaw: string,
    imagePrompt?: string,
    vehicle?: Vehicle
  ): Promise<DamageSummary> {
    const vehicleInfo = vehicle
      ? `Vehicle: ${vehicle.year ?? "Unknown year"} ${vehicle.make ?? "Unknown make"} ${vehicle.model ?? "Unknown model"}`
      : "Vehicle: Not specified";

    const imageInfo = imagePrompt
      ? `Image Analysis: ${imagePrompt}`
      : "No image provided";

    const systemPrompt = `You are an auto damage assessment expert. Analyze the provided damage description and generate a structured summary for obtaining repair quotes.

Output JSON with this exact schema:
{
  "description": "Clear, professional description of the damage",
  "severity": "minor" | "moderate" | "severe",
  "affected_areas": ["array", "of", "affected", "parts"],
  "estimated_repair_type": "Type of repair needed (e.g., 'body work', 'paint only', 'panel replacement')"
}

Guidelines:
- Be specific about damage location and extent
- Use industry-standard terminology
- Severity: "minor" = cosmetic only, "moderate" = functional impact, "severe" = safety concern
- List all visible damage areas
- Provide a clear repair type recommendation`;

    const userPrompt = `${vehicleInfo}

User's damage description: ${descriptionRaw}

${imageInfo}

Generate a structured damage summary for this repair quote request.`;

    const response = await this.chat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { thinking: { enabled: true }, jsonMode: true }
    );

    return JSON.parse(response) as DamageSummary;
  },

  /**
   * Generates a comparison report from call results.
   * Uses extended thinking for comprehensive analysis.
   *
   * @param prompt - Formatted prompt with call data
   * @param systemPrompt - System prompt defining report structure
   * @returns Raw JSON response string
   */
  async generateReport(prompt: string, systemPrompt: string): Promise<string> {
    return this.chat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      { thinking: { enabled: true }, jsonMode: true, maxTokens: 8192 }
    );
  },
};
