/**
 * Vapi Type Definitions
 *
 * Types for Vapi API interactions including assistant configuration,
 * webhook events, and API responses.
 *
 * @module lib/types/vapi
 */

/**
 * Vapi model thinking configuration.
 * CRITICAL: type MUST be "enabled" per spec requirements.
 */
export type VapiThinkingConfig = {
  /** REQUIRED: Must be "enabled" for Claude Opus 4.5 */
  type: "enabled";
  /** Token budget for reasoning (must be positive) */
  budgetTokens: number;
};

/**
 * Vapi assistant model configuration.
 * CRITICAL: provider MUST be "anthropic" and model MUST be "claude-opus-4-5-20251101".
 */
export type VapiModelConfig = {
  /** REQUIRED: Must be "anthropic" */
  provider: "anthropic";
  /** REQUIRED: Must be "claude-opus-4-5-20251101" */
  model: "claude-opus-4-5-20251101";
  /** REQUIRED: Thinking configuration with type "enabled" */
  thinking: VapiThinkingConfig;
  /** System and conversation messages */
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  /** Model temperature (0-1) */
  temperature?: number;
  /** Maximum tokens in response */
  maxTokens?: number;
};

/**
 * Vapi voice configuration.
 * CRITICAL: provider MUST be "11labs" (ElevenLabs).
 */
export type VapiVoiceConfig = {
  /** REQUIRED: Must be "11labs" (ElevenLabs) */
  provider: "11labs";
  /** ElevenLabs voice ID */
  voiceId: string;
  /** Voice stability (0-1, lower = more expressive) */
  stability?: number;
  /** Similarity boost (0-1, higher = more similar to original) */
  similarityBoost?: number;
  /** Style exaggeration (0-1) */
  style?: number;
  /** Enhanced clarity setting */
  useSpeakerBoost?: boolean;
};

/**
 * Vapi transcriber configuration.
 */
export type VapiTranscriberConfig = {
  /** Transcription provider */
  provider: "deepgram" | "assembly-ai";
  /** Language code */
  language?: string;
};

/**
 * JSON schema for structured data extraction.
 */
export type JsonSchema = {
  type: "object";
  properties: Record<string, { type: string; description?: string }>;
  required?: string[];
};

/**
 * Vapi analysis plan for extracting structured data from calls.
 */
export type VapiAnalysisPlan = {
  /** Structured data extraction configuration */
  structuredDataPlan?: {
    enabled: boolean;
    schema: JsonSchema;
  };
  /** Summary generation configuration */
  summaryPlan?: {
    enabled: boolean;
  };
};

/**
 * Vapi artifact plan for recordings and transcripts.
 */
export type VapiArtifactPlan = {
  /** Enable call recording */
  recordingEnabled?: boolean;
  /** Transcript configuration */
  transcriptPlan?: {
    enabled: boolean;
  };
};

/**
 * Vapi server configuration for webhooks.
 */
export type VapiServerConfig = {
  /** Webhook URL for call events */
  url: string;
  /** Optional headers to include in webhook requests */
  headers?: Record<string, string>;
};

/**
 * Custom metadata attached to assistant for webhook correlation.
 */
export type VapiAssistantMetadata = {
  /** Session ID for database correlation */
  session_id: string;
  /** Shop ID for database correlation */
  shop_id: string;
  /** Shop name for logging */
  shop_name: string;
};

/**
 * Complete Vapi assistant configuration.
 * CRITICAL: Must use ElevenLabs voice and Claude Opus 4.5 with Thinking enabled.
 */
export type VapiAssistantConfig = {
  /** First message the assistant speaks when call connects */
  firstMessage: string;
  /** LLM configuration - MUST use Claude Opus 4.5 with Thinking */
  model: VapiModelConfig;
  /** Voice configuration - MUST use ElevenLabs */
  voice: VapiVoiceConfig;
  /** Transcription configuration */
  transcriber?: VapiTranscriberConfig;
  /** Analysis plan for structured data extraction */
  analysisPlan?: VapiAnalysisPlan;
  /** Artifact plan for recordings and transcripts */
  artifactPlan?: VapiArtifactPlan;
  /** Server configuration for webhooks */
  server?: VapiServerConfig;
  /** Maximum call duration in seconds */
  maxDurationSeconds?: number;
  /** Phrases that trigger call termination */
  endCallPhrases?: string[];
  /** Custom metadata for webhook correlation */
  metadata?: VapiAssistantMetadata;
};

/**
 * Vapi call cost breakdown.
 */
export type VapiCostBreakdown = {
  /** Phone transport costs */
  transport: number;
  /** Speech-to-text costs */
  stt: number;
  /** LLM costs */
  llm: number;
  /** Text-to-speech costs */
  tts: number;
  /** Vapi platform costs */
  vapi: number;
  /** Total cost */
  total: number;
};

/**
 * Vapi call artifact containing transcript and messages.
 */
export type VapiCallArtifact = {
  /** Full call transcript */
  transcript?: string;
  /** Individual messages with timestamps */
  messages?: Array<{
    role: string;
    message: string;
    time: number;
  }>;
  /** Recording URL if enabled */
  recordingUrl?: string;
};

/**
 * Vapi call analysis results.
 */
export type VapiCallAnalysis = {
  /** AI-generated call summary */
  summary?: string;
  /** Structured data extracted per analysisPlan schema */
  structuredData?: {
    quote_provided?: boolean;
    price_estimate_low?: number;
    price_estimate_high?: number;
    timeframe_days?: number;
    requires_inspection?: boolean;
    shop_can_do_work?: boolean;
    notes?: string;
  };
};

/**
 * Vapi call object from API responses.
 */
export type VapiCall = {
  /** Vapi call ID */
  id: string;
  /** Call status */
  status: string;
  /** Reason call ended */
  endedReason?: string;
  /** Total call cost */
  cost?: number;
  /** Detailed cost breakdown */
  costBreakdown?: VapiCostBreakdown;
  /** Call artifacts (transcript, messages, recording) */
  artifact?: VapiCallArtifact;
  /** Analysis results (summary, structured data) */
  analysis?: VapiCallAnalysis;
};

/**
 * Response from Vapi call creation API.
 */
export type VapiCallResponse = VapiCall;

/**
 * Vapi webhook event types relevant to our use case.
 */
export type VapiWebhookEventType =
  | "call.started"
  | "call.ended"
  | "call.failed"
  | "assistant-message"
  | "user-message"
  | "transcript"
  | "status-update";

/**
 * Vapi webhook event payload.
 */
export type VapiWebhookEvent = {
  /** Event type */
  type: VapiWebhookEventType;
  /** Call data (present for call-related events) */
  call?: VapiCall;
  /** Assistant data including our custom metadata */
  assistant?: {
    metadata?: VapiAssistantMetadata;
  };
};
