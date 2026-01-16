/**
 * DEMO_MODE Enforcement
 *
 * CRITICAL SAFETY MODULE - Ensures demo mode restrictions are enforced
 * to prevent accidental calls to real phone numbers during demos and testing.
 *
 * @module lib/demo/enforcement
 */

import { env } from "@/lib/config/env";
import { DemoModeViolationError } from "@/lib/utils/errors";

/**
 * Enforces DEMO_MODE number restrictions.
 *
 * CRITICAL SAFETY FUNCTION - This MUST be called before ANY Vapi call creation.
 *
 * Behavior:
 * - If DEMO_MODE is false, returns the original number unchanged
 * - If the original number is in the demo allowlist, returns it unchanged
 * - If SCOPE_CALLS_TO_DEMO_LIST is true, throws an error for non-demo numbers
 * - Otherwise, replaces the number with a demo number based on the strategy
 *
 * @param originalNumber - The original phone number requested
 * @returns The number to actually dial (demo number if in DEMO_MODE, original otherwise)
 * @throws DemoModeViolationError if DEMO_MODE is enabled and number is not in allowlist
 *         (when SCOPE_CALLS_TO_DEMO_LIST is true)
 */
export function enforceDemoMode(originalNumber: string): string {
  const isDemoMode = env.DEMO_MODE === "true";
  const scopeToDemo = env.SCOPE_CALLS_TO_DEMO_LIST === "true";
  const demoNumbers = env.DEMO_TO_NUMBERS.split(",").map((n) => n.trim());
  const strategy = env.DEMO_NUMBER_STRATEGY;

  // Not in demo mode - return original number
  if (!isDemoMode) {
    return originalNumber;
  }

  // Check if original number is in demo allowlist
  if (demoNumbers.includes(originalNumber)) {
    return originalNumber;
  }

  // CRITICAL: Block non-demo numbers in strict mode
  if (scopeToDemo) {
    console.error(
      `BLOCKED: Attempted to call non-demo number ${originalNumber} in DEMO_MODE`
    );
    throw new DemoModeViolationError(originalNumber);
  }

  // Replace with demo number based on strategy
  let replacement: string;

  if (strategy === "round-robin") {
    // Randomly select from available demo numbers
    const index = Math.floor(Math.random() * demoNumbers.length);
    replacement = demoNumbers[index];
  } else {
    // "first" strategy - always use the first demo number
    replacement = demoNumbers[0];
  }

  console.warn(`DEMO_MODE: Replacing ${originalNumber} with ${replacement}`);
  return replacement;
}

/**
 * Checks if outbound calls are allowed.
 *
 * @returns True if ALLOW_OUTBOUND_CALLS is set to "true"
 */
export function areCallsAllowed(): boolean {
  return env.ALLOW_OUTBOUND_CALLS === "true";
}

/**
 * Returns whether DEMO_MODE is active.
 *
 * @returns True if DEMO_MODE is set to "true"
 */
export function isDemoMode(): boolean {
  return env.DEMO_MODE === "true";
}

/**
 * Gets the list of allowed demo phone numbers.
 *
 * @returns Array of phone numbers in E.164 format
 */
export function getDemoNumbers(): string[] {
  return env.DEMO_TO_NUMBERS.split(",").map((n) => n.trim());
}

/**
 * Validates that a phone number is allowed to be called.
 * Does not throw, just returns a boolean.
 *
 * @param phoneNumber - Phone number to validate
 * @returns True if the number can be called (either not in demo mode, or is a demo number)
 */
export function isNumberAllowed(phoneNumber: string): boolean {
  if (!isDemoMode()) {
    return true;
  }

  const demoNumbers = getDemoNumbers();
  return demoNumbers.includes(phoneNumber);
}
