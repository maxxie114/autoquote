/**
 * Vapi API Client
 *
 * Client for interacting with the Vapi voice AI platform.
 * Handles outbound call creation and call status retrieval.
 *
 * CRITICAL: All calls are validated against HARD REQUIREMENTS:
 * - ElevenLabs as the ONLY voice provider
 * - Claude Opus 4.5 (Thinking) as the ONLY LLM
 * - DEMO_MODE number enforcement
 *
 * @module lib/services/vapi/client
 */

import { env } from "@/lib/config/env";
import type { VapiAssistantConfig, VapiCallResponse } from "@/lib/types/vapi";
import type { Shop } from "@/lib/types/session";
import { validateAssistantConfig } from "./validation";
import { enforceDemoMode } from "@/lib/demo/enforcement";
import { ExternalServiceError } from "@/lib/utils/errors";
import { API_ENDPOINTS } from "@/lib/config/constants";

/**
 * Vapi API client for voice call operations.
 */
export const VapiClient = {
  /**
   * Creates an outbound call via Vapi API.
   *
   * CRITICAL: This function enforces THREE mandatory requirements:
   * 1. DEMO_MODE number restrictions (via enforceDemoMode)
   * 2. ElevenLabs as the ONLY voice provider (via validateAssistantConfig)
   * 3. Claude Opus 4.5 (Thinking) as the ONLY LLM (via validateAssistantConfig)
   *
   * @param sessionId - Session ID for correlation
   * @param shop - Shop to call
   * @param assistantConfig - Vapi assistant configuration
   * @returns Vapi call response with call ID
   * @throws SpecViolationError if assistant config violates HARD REQUIREMENTS
   * @throws DemoModeViolationError if phone number is blocked in DEMO_MODE
   * @throws ExternalServiceError if Vapi API call fails
   */
  async createCall(
    sessionId: string,
    shop: Shop,
    assistantConfig: VapiAssistantConfig
  ): Promise<VapiCallResponse> {
    // CRITICAL: Validate HARD REQUIREMENTS before proceeding
    validateAssistantConfig(assistantConfig);

    // CRITICAL: Enforce DEMO_MODE
    const targetNumber = enforceDemoMode(shop.phone);

    // Add metadata for webhook correlation
    const configWithMetadata: VapiAssistantConfig = {
      ...assistantConfig,
      metadata: {
        session_id: sessionId,
        shop_id: shop.id,
        shop_name: shop.name,
      },
    };

    try {
      const response = await fetch(`${API_ENDPOINTS.VAPI}/call`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.VAPI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Use transient assistant for per-call customization
          assistant: configWithMetadata,
          // Phone number to call FROM (Vapi phone number)
          phoneNumberId: env.VAPI_PHONE_NUMBER_ID,
          // Customer (shop) to call
          customer: {
            number: targetNumber,
            name: shop.name,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(JSON.stringify(error));
      }

      return (await response.json()) as VapiCallResponse;
    } catch (error) {
      throw new ExternalServiceError(
        "Vapi",
        error instanceof Error ? error.message : "Unknown error",
        error
      );
    }
  },

  /**
   * Retrieves call details including artifacts.
   *
   * @param callId - Vapi call ID
   * @returns Call details with transcript, analysis, etc.
   * @throws ExternalServiceError if API call fails
   */
  async getCall(callId: string): Promise<VapiCallResponse> {
    try {
      const response = await fetch(`${API_ENDPOINTS.VAPI}/call/${callId}`, {
        headers: {
          Authorization: `Bearer ${env.VAPI_API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return (await response.json()) as VapiCallResponse;
    } catch (error) {
      throw new ExternalServiceError(
        "Vapi",
        `Failed to get call ${callId}: ${error instanceof Error ? error.message : "Unknown error"}`,
        error
      );
    }
  },

  /**
   * Lists recent calls.
   *
   * @param limit - Maximum number of calls to return
   * @returns Array of call responses
   * @throws ExternalServiceError if API call fails
   */
  async listCalls(limit = 50): Promise<VapiCallResponse[]> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.VAPI}/call?limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${env.VAPI_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return (await response.json()) as VapiCallResponse[];
    } catch (error) {
      throw new ExternalServiceError(
        "Vapi",
        `Failed to list calls: ${error instanceof Error ? error.message : "Unknown error"}`,
        error
      );
    }
  },

  /**
   * Cancels an in-progress call.
   *
   * @param callId - Vapi call ID to cancel
   * @throws ExternalServiceError if API call fails
   */
  async cancelCall(callId: string): Promise<void> {
    try {
      const response = await fetch(`${API_ENDPOINTS.VAPI}/call/${callId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${env.VAPI_API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      throw new ExternalServiceError(
        "Vapi",
        `Failed to cancel call ${callId}: ${error instanceof Error ? error.message : "Unknown error"}`,
        error
      );
    }
  },
};
