/**
 * Application Constants
 *
 * Centralized constants used throughout the AutoQuote AI application.
 * These values are compile-time constants and should not change at runtime.
 *
 * @module lib/config/constants
 */

/**
 * Session status values representing the workflow state machine.
 */
export const SESSION_STATUS = {
  /** Session created, awaiting user to start workflow */
  CREATED: "CREATED",
  /** Running image-to-prompt and damage summary generation */
  ANALYZING: "ANALYZING",
  /** Parallel Vapi calls in progress */
  CALLING: "CALLING",
  /** All calls complete, generating final report */
  SUMMARIZING: "SUMMARIZING",
  /** Report ready for user */
  DONE: "DONE",
  /** Unrecoverable error occurred */
  FAILED: "FAILED",
} as const;

/**
 * Call status values for individual Vapi calls.
 */
export const CALL_STATUS = {
  /** Call record created, not yet initiated */
  PENDING: "PENDING",
  /** Vapi call in progress */
  IN_PROGRESS: "IN_PROGRESS",
  /** Call completed successfully */
  COMPLETED: "COMPLETED",
  /** Call failed */
  FAILED: "FAILED",
} as const;

/**
 * Damage severity levels.
 */
export const DAMAGE_SEVERITY = {
  MINOR: "minor",
  MODERATE: "moderate",
  SEVERE: "severe",
} as const;

/**
 * Vapi configuration constants.
 * CRITICAL: These values are HARD REQUIREMENTS per the spec.
 */
export const VAPI_CONFIG = {
  /** REQUIRED: ElevenLabs is the ONLY permitted voice provider */
  VOICE_PROVIDER: "11labs",

  /** REQUIRED: Anthropic is the ONLY permitted model provider */
  MODEL_PROVIDER: "anthropic",

  /** REQUIRED: Claude Opus 4.5 is the ONLY permitted model */
  MODEL_ID: "claude-opus-4-5-20251101",

  /** REQUIRED: Thinking must be enabled */
  THINKING_TYPE: "enabled",

  /** Default max call duration in seconds (5 minutes) */
  DEFAULT_MAX_DURATION_SECONDS: 300,

  /** Default temperature for model responses */
  DEFAULT_TEMPERATURE: 0.7,

  /** Default max tokens for model responses */
  DEFAULT_MAX_TOKENS: 2048,
} as const;

/**
 * ElevenLabs voice IDs for different voice options.
 */
export const ELEVENLABS_VOICES = {
  /** Rachel - female, calm (DEFAULT) */
  RACHEL: "21m00Tcm4TlvDq8ikWAM",
  /** Domi - female, confident */
  DOMI: "AZnzlk1XvdvUeBnXmlld",
  /** Bella - female, soft */
  BELLA: "EXAVITQu4vr4xnSDxMaL",
  /** Antoni - male, expressive */
  ANTONI: "ErXwobaYiN019PkySvjV",
  /** Arnold - male, deep */
  ARNOLD: "VR6AewLTigWG4xSOukaG",
} as const;

/**
 * API endpoints.
 */
export const API_ENDPOINTS = {
  /** Vapi API base URL */
  VAPI: "https://api.vapi.ai",
  /** OpenRouter API base URL */
  OPENROUTER: "https://openrouter.ai/api/v1",
  /** Freepik API base URL */
  FREEPIK: "https://api.freepik.com/v1",
} as const;

/**
 * Polling intervals in milliseconds.
 */
export const POLLING_INTERVALS = {
  /** Session status polling interval */
  SESSION_STATUS: 3000,
} as const;
