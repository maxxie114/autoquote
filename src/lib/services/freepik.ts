/**
 * Freepik Service
 *
 * Client for the Freepik Image-to-Prompt API.
 * Used to generate text descriptions from uploaded car damage images.
 *
 * @module lib/services/freepik
 */

import { env } from "@/lib/config/env";
import { ExternalServiceError } from "@/lib/utils/errors";

/**
 * Response from Freepik image-to-prompt task creation.
 */
export type FreepikTaskResponse = {
  /** Task ID for tracking */
  task_id: string;
  /** Current task status */
  status: "PENDING" | "COMPLETED" | "FAILED";
  /** Result when completed */
  result?: {
    /** Generated text prompt describing the image */
    prompt: string;
  };
};

/**
 * Freepik service for image-to-prompt functionality.
 */
export const FreepikService = {
  /**
   * Initiates an async image-to-prompt task.
   * The result will be delivered via webhook when complete.
   *
   * @param imageUrl - URL of the image to analyze (S3 presigned URL or public URL)
   * @param sessionId - Session ID for webhook correlation
   * @returns Task ID for tracking
   * @throws ExternalServiceError if the API call fails
   */
  async createImageToPromptTask(
    imageUrl: string,
    sessionId: string
  ): Promise<string> {
    try {
      const response = await fetch(
        "https://api.freepik.com/v1/ai/image-to-prompt",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-freepik-api-key": env.FREEPIK_API_KEY,
          },
          body: JSON.stringify({
            image: imageUrl,
            webhook_url: `${env.FREEPIK_WEBHOOK_URL}?session_id=${sessionId}`,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as FreepikTaskResponse;
      return data.task_id;
    } catch (error) {
      throw new ExternalServiceError(
        "Freepik",
        error instanceof Error ? error.message : "Unknown error",
        error
      );
    }
  },

  /**
   * Polls for task completion (use sparingly, prefer webhook).
   * Only use as a fallback if webhooks are not working.
   *
   * @param taskId - Task ID to check
   * @returns Task status and result if complete
   * @throws ExternalServiceError if the API call fails
   */
  async getTaskStatus(taskId: string): Promise<FreepikTaskResponse> {
    try {
      const response = await fetch(
        `https://api.freepik.com/v1/ai/image-to-prompt/${taskId}`,
        {
          headers: {
            "x-freepik-api-key": env.FREEPIK_API_KEY,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return (await response.json()) as FreepikTaskResponse;
    } catch (error) {
      throw new ExternalServiceError(
        "Freepik",
        error instanceof Error ? error.message : "Unknown error",
        error
      );
    }
  },
};
