/**
 * Session Status Page
 *
 * Displays the current status of a quote session and allows starting the workflow.
 *
 * @module app/session/[id]/page
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/glass/glass-card";
import { StatusStepper } from "@/components/session/status-stepper";
import { CallLogTable } from "@/components/session/call-log-table";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";

/**
 * SessionPage component for viewing session status and managing the workflow.
 */
export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { session, calls, isLoading, error, refetch } = useSession(sessionId);
  const [isStarting, setIsStarting] = useState(false);

  // Extract status for dependency array stability
  const sessionStatus = session?.status;

  // Poll for updates when session is in progress
  useEffect(() => {
    if (!sessionStatus) return;

    const activeStatuses = ["ANALYZING", "CALLING", "SUMMARIZING"];
    if (activeStatuses.includes(sessionStatus)) {
      const interval = setInterval(refetch, 3000);
      return () => clearInterval(interval);
    }
  }, [sessionStatus, refetch]);

  // Show success message when done
  useEffect(() => {
    if (sessionStatus === "DONE") {
      toast.success("Quote comparison complete!");
    }
  }, [sessionStatus]);

  /**
   * Starts the quote workflow.
   */
  const handleStart = async () => {
    setIsStarting(true);
    try {
      const response = await fetch(`/api/v1/sessions/${sessionId}/start`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start workflow");
      }

      toast.success("Workflow started! AI is now calling shops...");
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start workflow"
      );
    } finally {
      setIsStarting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <GlassCard className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/10 rounded w-1/3" />
            <div className="h-4 bg-white/10 rounded w-1/2" />
            <div className="h-32 bg-white/10 rounded" />
          </div>
        </GlassCard>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <GlassCard className="max-w-md mx-auto text-center">
          <svg
            className="w-16 h-16 mx-auto text-red-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
          <p className="text-white/60 mb-6">{error.message}</p>
          <Button onClick={() => router.push("/session/new")}>
            Create New Session
          </Button>
        </GlassCard>
      </div>
    );
  }

  // Not found state
  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <GlassCard className="max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold text-white mb-2">
            Session Not Found
          </h2>
          <p className="text-white/60 mb-6">
            This session doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Button onClick={() => router.push("/session/new")}>
            Create New Session
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Quote Request</h1>
            <p className="text-white/60 text-sm">
              Session ID: {sessionId.slice(0, 8)}...
            </p>
          </div>
          {session.status === "DONE" && (
            <Button asChild className="bg-green-500 hover:bg-green-600">
              <Link href={`/session/${sessionId}/report`}>View Report</Link>
            </Button>
          )}
        </div>

        {/* Status Stepper */}
        <GlassCard>
          <h2 className="text-lg font-semibold text-white mb-4">
            Workflow Status
          </h2>
          <StatusStepper currentStatus={session.status} />
        </GlassCard>

        {/* Start Button (only for CREATED status) */}
        {session.status === "CREATED" && (
          <GlassCard>
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-white">
                Ready to Get Quotes?
              </h2>
              <p className="text-white/60 max-w-md mx-auto">
                Our AI will call {session.shops.length} shops simultaneously to
                collect quotes for your repair. This usually takes about 5
                minutes.
              </p>
              <Button
                onClick={handleStart}
                disabled={isStarting}
                size="lg"
                className="bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                {isStarting ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Starting...
                  </span>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    Start Calling Shops
                  </>
                )}
              </Button>
            </div>
          </GlassCard>
        )}

        {/* Session Details */}
        <GlassCard>
          <h2 className="text-lg font-semibold text-white mb-4">
            Request Details
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white/60 text-xs uppercase tracking-wide mb-1">
                Location
              </h3>
              <p className="text-white">{session.location}</p>
            </div>
            {session.vehicle && (
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-white/60 text-xs uppercase tracking-wide mb-1">
                  Vehicle
                </h3>
                <p className="text-white">
                  {session.vehicle.year} {session.vehicle.make}{" "}
                  {session.vehicle.model}
                </p>
              </div>
            )}
            <div className="bg-white/5 rounded-lg p-4 md:col-span-2">
              <h3 className="text-white/60 text-xs uppercase tracking-wide mb-1">
                Damage Description
              </h3>
              <p className="text-white text-sm">
                {session.damage_summary?.description || session.description_raw}
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Call Log (shown when calls exist) */}
        {calls.length > 0 && (
          <GlassCard>
            <h2 className="text-lg font-semibold text-white mb-4">
              Call Log ({calls.length} calls)
            </h2>
            <CallLogTable calls={calls} shops={session.shops} />
          </GlassCard>
        )}

        {/* Failed State Actions */}
        {session.status === "FAILED" && (
          <GlassCard className="border-red-500/30">
            <div className="text-center space-y-4">
              <svg
                className="w-12 h-12 mx-auto text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h2 className="text-xl font-semibold text-red-400">
                Session Failed
              </h2>
              <p className="text-white/60 max-w-md mx-auto">
                Something went wrong during processing. Please try creating a
                new session.
              </p>
              <Button
                onClick={() => router.push("/session/new")}
                className="bg-indigo-500 hover:bg-indigo-600"
              >
                Create New Session
              </Button>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
