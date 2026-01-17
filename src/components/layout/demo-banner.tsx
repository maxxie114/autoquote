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
      <span className="inline-flex items-center gap-2.5">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30">
          <svg
            className="w-3 h-3 text-amber-400"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        </span>
        <span className="text-amber-100/90">
          <strong>DEMO MODE</strong>
          <span className="mx-1.5 text-amber-500/50">—</span>
          Calls go only to test numbers. No real shops will be contacted.
        </span>
      </span>
    </div>
  );
}
