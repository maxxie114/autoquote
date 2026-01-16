/**
 * Call Type Definitions
 *
 * Types for the Calls DynamoDB table and related data structures.
 *
 * @module lib/types/call
 */

/**
 * Call status values for individual Vapi calls.
 */
export type CallStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

/**
 * Structured data extracted from a call via Vapi's analysisPlan.
 */
export type CallStructuredData = {
  /** Whether a quote was provided during the call */
  quote_provided?: boolean;
  /** Low end of price estimate in dollars */
  price_estimate_low?: number;
  /** High end of price estimate in dollars */
  price_estimate_high?: number;
  /** Estimated repair timeframe in days */
  timeframe_days?: number;
  /** Whether in-person inspection is required */
  requires_inspection?: boolean;
  /** Whether the shop can perform the work */
  shop_can_do_work?: boolean;
  /** Additional notes extracted from the conversation */
  notes?: string;
};

/**
 * Call record in DynamoDB.
 * Partition key: session_id
 * Sort key: shop_id
 */
export type Call = {
  /** Reference to parent session */
  session_id: string;
  /** Reference to shop being called */
  shop_id: string;
  /** Vapi call identifier (set when call is initiated) */
  vapi_call_id?: string;
  /** Destination phone number (reflects DEMO_MODE override) */
  to_number: string;
  /** Current call status */
  status: CallStatus;
  /** Full call transcript from Vapi */
  transcript?: string;
  /** Structured data extracted by Vapi's analysisPlan */
  structured_data?: CallStructuredData;
  /** AI-generated call summary */
  summary?: string;
  /** Total call cost from Vapi */
  cost?: number;
  /** Call duration in seconds */
  duration_seconds?: number;
  /** Reason the call ended (from Vapi) */
  ended_reason?: string;
  /** Recording URL if recording was enabled */
  recording_url?: string;
  /** ISO 8601 creation timestamp */
  created_at: string;
  /** ISO 8601 last update timestamp */
  updated_at: string;
};

/**
 * Input for creating a new call record.
 */
export type CreateCallInput = Omit<Call, "vapi_call_id" | "transcript" | "structured_data" | "summary" | "cost" | "duration_seconds" | "ended_reason" | "recording_url">;

/**
 * Fields that can be updated on a call record.
 */
export type UpdateCallInput = Partial<Omit<Call, "session_id" | "shop_id" | "created_at">>;
