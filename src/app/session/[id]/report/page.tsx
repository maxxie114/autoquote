/**
 * Report Page
 *
 * Displays the final comparison report for a completed session.
 *
 * @module app/session/[id]/report/page
 */

"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/glass/glass-card";
import { ReportComparison } from "@/components/report/report-comparison";
import { BestPickBanner } from "@/components/report/best-pick-banner";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";

/**
 * ReportPage component for viewing the final comparison report.
 */
export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { session, isLoading, error } = useSession(sessionId);

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="animate-pulse">
            <div className="h-10 bg-white/10 rounded w-1/3 mb-6" />
            <div className="h-32 bg-white/10 rounded mb-6" />
            <div className="grid gap-4 md:grid-cols-3">
              <div className="h-48 bg-white/10 rounded" />
              <div className="h-48 bg-white/10 rounded" />
              <div className="h-48 bg-white/10 rounded" />
            </div>
          </div>
        </div>
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
          <Button onClick={() => router.push(`/session/${sessionId}`)}>
            Back to Session
          </Button>
        </GlassCard>
      </div>
    );
  }

  // Not found / no report state
  if (!session || !session.report) {
    return (
      <div className="container mx-auto px-4 py-8">
        <GlassCard className="max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold text-white mb-2">
            Report Not Available
          </h2>
          <p className="text-white/60 mb-6">
            {session?.status === "DONE"
              ? "Report data is not available."
              : "The session is still in progress. Please wait for it to complete."}
          </p>
          <Button onClick={() => router.push(`/session/${sessionId}`)}>
            Back to Session
          </Button>
        </GlassCard>
      </div>
    );
  }

  const { report } = session;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Quote Comparison Report
            </h1>
            <p className="text-white/60 text-sm">
              Generated for session {sessionId.slice(0, 8)}...
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => router.push(`/session/${sessionId}`)}
            >
              Back to Session
            </Button>
            <Button
              asChild
              className="bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              <Link href="/session/new">New Quote</Link>
            </Button>
          </div>
        </div>

        {/* Best Pick Banner */}
        <BestPickBanner bestPick={report.best_pick} quotes={report.quotes} />

        {/* Summary */}
        <GlassCard>
          <h2 className="text-lg font-semibold text-white mb-2">Summary</h2>
          <p className="text-white/80">{report.summary}</p>
        </GlassCard>

        {/* Damage Summary */}
        {session.damage_summary && (
          <GlassCard>
            <h2 className="text-lg font-semibold text-white mb-4">
              Damage Assessment
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-white/60 text-xs uppercase tracking-wide mb-1">
                  Description
                </h3>
                <p className="text-white text-sm">
                  {session.damage_summary.description}
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className="text-white/60 text-xs uppercase tracking-wide mb-1">
                    Severity
                  </h3>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-sm font-medium ${
                      session.damage_summary.severity === "severe"
                        ? "bg-red-500/20 text-red-400"
                        : session.damage_summary.severity === "moderate"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    {session.damage_summary.severity.charAt(0).toUpperCase() +
                      session.damage_summary.severity.slice(1)}
                  </span>
                </div>
                <div>
                  <h3 className="text-white/60 text-xs uppercase tracking-wide mb-1">
                    Affected Areas
                  </h3>
                  <p className="text-white text-sm">
                    {session.damage_summary.affected_areas.join(", ")}
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Quote Comparison */}
        <ReportComparison
          quotes={report.quotes}
          shops={session.shops}
          bestOverall={report.best_pick.overall}
        />

        {/* Disclaimer */}
        <GlassCard variant="subtle">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-white/50 text-sm">{report.disclaimer}</p>
          </div>
        </GlassCard>

        {/* Actions */}
        <div className="flex justify-center gap-4 pt-4">
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() => window.print()}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print Report
          </Button>
          <Button asChild className="bg-indigo-500 hover:bg-indigo-600 text-white">
            <Link href="/session/new">Get Another Quote</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
