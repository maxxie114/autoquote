/**
 * Environment Configuration Module
 *
 * This module validates and exports all environment variables required by
 * the AutoQuote AI application. Uses Zod for runtime validation to ensure
 * type safety and catch configuration errors early.
 *
 * Validation is lazy - it only runs when the env object is first accessed,
 * not during module load. This allows the build to complete without requiring
 * all environment variables to be set at build time.
 *
 * @module lib/config/env
 */

import { z } from "zod";

/**
 * Zod schema for validating all environment variables.
 * All required variables must be set; optional ones have defaults.
 */
const envSchema = z.object({
  // ============================================================
  // Auth0 Configuration (SDK v4 format)
  // ============================================================

  /** Auth0 secret for session encryption (min 32 chars) */
  AUTH0_SECRET: z.string().min(32),

  /**
   * Auth0 tenant domain (WITHOUT https:// scheme!)
   * Example: your-tenant.us.auth0.com
   * Note: In Auth0 SDK v4, this replaced AUTH0_ISSUER_BASE_URL
   */
  AUTH0_DOMAIN: z.string().min(1),

  /** Auth0 application client ID */
  AUTH0_CLIENT_ID: z.string().min(1),

  /** Auth0 application client secret */
  AUTH0_CLIENT_SECRET: z.string().min(1),

  /**
   * Application base URL (e.g., http://localhost:3000 or https://autoquote.ai)
   * Note: In Auth0 SDK v4, this replaced AUTH0_BASE_URL
   */
  APP_BASE_URL: z.string().url(),

  // ============================================================
  // OpenRouter + Claude Configuration
  // ============================================================

  /** OpenRouter API key (must start with sk-or-) */
  OPENROUTER_API_KEY: z.string().startsWith("sk-or-"),

  /** OpenRouter model identifier - MUST be Claude Opus 4.5 */
  OPENROUTER_MODEL: z.literal("anthropic/claude-opus-4.5"),

  /** Token budget for Claude's extended thinking feature */
  CLAUDE_THINKING_BUDGET_TOKENS: z.coerce.number().min(1000).default(10000),

  // ============================================================
  // Freepik Configuration
  // ============================================================

  /** Freepik API key for image-to-prompt functionality */
  FREEPIK_API_KEY: z.string().min(1),

  /** Webhook URL for Freepik async task completion */
  FREEPIK_WEBHOOK_URL: z.string().url(),

  // ============================================================
  // Vapi Configuration
  // ============================================================

  /** Vapi API key for voice calling */
  VAPI_API_KEY: z.string().min(1),

  /** Vapi phone number ID for outbound calls */
  VAPI_PHONE_NUMBER_ID: z.string().min(1),

  /** Secret for validating Vapi webhook signatures */
  VAPI_WEBHOOK_SECRET: z.string().min(1),

  // ============================================================
  // ElevenLabs Configuration (reference only - configured in Vapi)
  // ============================================================

  /** ElevenLabs voice ID - default is Rachel (calm female voice) */
  ELEVENLABS_VOICE_ID: z.string().default("21m00Tcm4TlvDq8ikWAM"),

  // ============================================================
  // AWS Configuration
  // ============================================================

  /** AWS region for DynamoDB and S3 */
  AWS_REGION: z.string().default("us-east-1"),

  /** AWS access key ID */
  AWS_ACCESS_KEY_ID: z.string().min(1),

  /** AWS secret access key */
  AWS_SECRET_ACCESS_KEY: z.string().min(1),

  /** DynamoDB table name for sessions */
  DYNAMODB_TABLE_SESSIONS: z.string().default("autoquote-sessions"),

  /** DynamoDB table name for calls */
  DYNAMODB_TABLE_CALLS: z.string().default("autoquote-calls"),

  /** S3 bucket name for media uploads */
  S3_BUCKET_MEDIA: z.string().min(1),

  // ============================================================
  // DEMO Safety Switches (MANDATORY)
  // ============================================================

  /**
   * Master demo mode switch.
   * When true, enables all demo safety features.
   * CRITICAL: Must be true for any demo or testing environment.
   */
  DEMO_MODE: z.enum(["true", "false"]).default("true"),

  /**
   * Comma-separated list of allowed demo phone numbers.
   * Only these numbers can be called when DEMO_MODE is true.
   */
  DEMO_TO_NUMBERS: z.string().min(1),

  /**
   * Strategy for selecting demo numbers when replacing real numbers.
   * - "round-robin": Randomly select from available demo numbers
   * - "first": Always use the first demo number
   */
  DEMO_NUMBER_STRATEGY: z.enum(["round-robin", "first"]).default("round-robin"),

  /**
   * When true, throws error if attempting to call non-demo numbers.
   * When false, replaces non-demo numbers with demo numbers.
   * CRITICAL: Should be true in strict demo environments.
   */
  SCOPE_CALLS_TO_DEMO_LIST: z.enum(["true", "false"]).default("true"),

  /**
   * Master switch for outbound calls.
   * When false, no calls are made regardless of other settings.
   */
  ALLOW_OUTBOUND_CALLS: z.enum(["true", "false"]).default("true"),

  // ============================================================
  // Application URLs
  // ============================================================

  /** Public URL of the application (for webhooks) */
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

/**
 * TypeScript type for the validated environment configuration.
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Cached environment variables - populated on first access.
 */
let _env: Env | undefined;

/**
 * Validates and returns the environment variables.
 * Uses lazy loading to avoid failing during build time.
 *
 * @returns Validated environment configuration
 * @throws ZodError if validation fails at runtime
 */
function getEnv(): Env {
  if (_env) {
    return _env;
  }

  // Skip validation during build time (no env vars available)
  // This allows `next build` to complete without env vars
  const isBuildTime = process.env.NODE_ENV === "production" && typeof window === "undefined";
  const hasRequiredEnvVars = process.env.AUTH0_SECRET !== undefined;

  if (isBuildTime && !hasRequiredEnvVars) {
    // Return dummy values during build to prevent errors
    // Actual validation happens at runtime
    console.warn(
      "[env] Skipping env validation during build. Ensure env vars are set at runtime."
    );
    return {} as Env;
  }

  _env = envSchema.parse(process.env);
  return _env;
}

/**
 * Proxy object that lazily validates and returns environment variables.
 * This allows imports at the top of files without triggering validation
 * until the values are actually accessed.
 *
 * @example
 * ```typescript
 * import { env } from '@/lib/config/env';
 *
 * // Validation happens here, when value is accessed
 * const apiKey = env.OPENROUTER_API_KEY;
 * ```
 */
export const env: Env = new Proxy({} as Env, {
  get(_target, prop: keyof Env) {
    const envVars = getEnv();
    return envVars[prop];
  },
});
