/**
 * usePolling Hook
 *
 * React hook for polling data at regular intervals.
 *
 * @module hooks/use-polling
 */

"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Options for the usePolling hook.
 */
export type UsePollingOptions = {
  /** Polling interval in milliseconds */
  interval: number;
  /** Whether polling is enabled */
  enabled?: boolean;
  /** Whether to poll immediately on mount */
  immediate?: boolean;
};

/**
 * Hook for polling a function at regular intervals.
 *
 * Automatically cleans up the interval on unmount or when disabled.
 *
 * @param callback - Function to call at each interval
 * @param options - Polling configuration
 *
 * @example
 * ```tsx
 * const { start, stop } = usePolling(
 *   async () => {
 *     const data = await fetchData();
 *     setData(data);
 *   },
 *   { interval: 3000, enabled: isActive }
 * );
 * ```
 */
export function usePolling(
  callback: () => void | Promise<void>,
  options: UsePollingOptions
): {
  /** Manually start polling */
  start: () => void;
  /** Manually stop polling */
  stop: () => void;
} {
  const { interval, enabled = true, immediate = false } = options;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  /**
   * Stops the polling interval.
   */
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Starts the polling interval.
   */
  const start = useCallback(() => {
    stop();
    intervalRef.current = setInterval(() => {
      callbackRef.current();
    }, interval);
  }, [interval, stop]);

  // Set up polling based on enabled state
  useEffect(() => {
    if (enabled) {
      if (immediate) {
        callbackRef.current();
      }
      start();
    } else {
      stop();
    }

    return stop;
  }, [enabled, immediate, start, stop]);

  return { start, stop };
}
