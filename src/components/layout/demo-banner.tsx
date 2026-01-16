/**
 * DemoBanner Component
 *
 * Displays a persistent banner when DEMO_MODE is enabled.
 * This is a CRITICAL safety feature to ensure users know they're in demo mode.
 *
 * @module components/layout/demo-banner
 */

"use client";

/**
 * DemoBanner component that displays a warning banner in demo mode.
 *
 * The banner is rendered at the top of the viewport to always be visible.
 * It informs users that calls will only go to test numbers.
 *
 * Note: Environment variable is checked at build/render time.
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * <DemoBanner />
 * <main className="pt-12">...</main>
 * ```
 */
export function DemoBanner() {
  // Check if DEMO_MODE is enabled via environment variable
  // Note: Only NEXT_PUBLIC_ prefixed vars are available on client
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  // Don't render anything if not in demo mode
  if (!isDemoMode) {
    return null;
  }

  return (
    <div className="demo-banner" role="alert" aria-live="polite">
      <span className="inline-flex items-center gap-2">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span>
          <strong>DEMO MODE</strong> — Calls go only to test numbers. No real
          shops will be contacted.
        </span>
      </span>
    </div>
  );
}
