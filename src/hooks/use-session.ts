/**
 * useSession Hook
 *
 * React hook for fetching and managing session data with automatic polling.
 *
 * @module hooks/use-session
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { Session } from "@/lib/types/session";
import type { Call } from "@/lib/types/call";

/**
 * Result type for the useSession hook.
 */
export type UseSessionResult = {
  /** Session data if loaded */
  session: Session | null;
  /** Call records for the session */
  calls: Call[];
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Function to manually refetch data */
  refetch: () => Promise<void>;
};

/**
 * Hook for fetching and managing session data.
 *
 * Provides session and call data with loading states and error handling.
 * Call refetch() to manually refresh, or use with useEffect for polling.
 *
 * @param sessionId - ID of the session to fetch
 * @returns Session data, calls, loading state, and error
 *
 * @example
 * ```tsx
 * const { session, calls, isLoading, error, refetch } = useSession(sessionId);
 *
 * // Poll for updates while session is in progress
 * useEffect(() => {
 *   if (session?.status === "CALLING") {
 *     const interval = setInterval(refetch, 3000);
 *     return () => clearInterval(interval);
 *   }
 * }, [session?.status, refetch]);
 * ```
 */
export function useSession(sessionId: string): UseSessionResult {
  const [session, setSession] = useState<Session | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetches session and call data from the API.
   */
  const fetchData = useCallback(async () => {
    try {
      // Fetch session
      const sessionResponse = await fetch(`/api/v1/sessions/${sessionId}`);
      if (!sessionResponse.ok) {
        if (sessionResponse.status === 404) {
          throw new Error("Session not found");
        }
        throw new Error("Failed to fetch session");
      }
      const sessionData = await sessionResponse.json();
      setSession(sessionData);

      // Fetch calls if session exists
      const callsResponse = await fetch(`/api/v1/sessions/${sessionId}/calls`);
      if (callsResponse.ok) {
        const callsData = await callsResponse.json();
        setCalls(callsData);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  /**
   * Manual refetch function.
   */
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    setIsLoading(true);
    fetchData();
  }, [fetchData]);

  return {
    session,
    calls,
    isLoading,
    error,
    refetch,
  };
}
