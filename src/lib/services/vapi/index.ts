/**
 * Vapi Services Index
 *
 * Re-exports all Vapi-related modules for convenient imports.
 *
 * @module lib/services/vapi
 */

export { VapiClient } from "./client";
export { buildAssistantConfig, getVapiWebhookUrl } from "./assistant";
export {
  validateAssistantConfig,
  isValidVoiceProvider,
  isValidModelProvider,
  isValidModel,
} from "./validation";
