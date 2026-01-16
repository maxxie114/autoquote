/**
 * StatusStepper Component
 *
 * Displays the workflow progress as a vertical stepper with status indicators.
 *
 * @module components/session/status-stepper
 */

"use client";

import type { SessionStatus } from "@/lib/types/session";
import { cn } from "@/lib/utils";

/**
 * Status step configuration.
 */
type Step = {
  id: SessionStatus;
  label: string;
  description: string;
};

/**
 * Workflow steps in order.
 */
const STEPS: Step[] = [
  {
    id: "CREATED",
    label: "Created",
    description: "Session ready to start",
  },
  {
    id: "ANALYZING",
    label: "Analyzing",
    description: "Processing damage information",
  },
  {
    id: "CALLING",
    label: "Calling Shops",
    description: "AI is calling repair shops",
  },
  {
    id: "SUMMARIZING",
    label: "Summarizing",
    description: "Generating comparison report",
  },
  {
    id: "DONE",
    label: "Complete",
    description: "Report ready",
  },
];

/**
 * Props for the StatusStepper component.
 */
export type StatusStepperProps = {
  /** Current session status */
  currentStatus: SessionStatus;
};

/**
 * StatusStepper component displaying workflow progress.
 *
 * Shows each step with visual indicators for pending, active, completed,
 * and failed states.
 *
 * @example
 * ```tsx
 * <StatusStepper currentStatus="CALLING" />
 * ```
 */
export function StatusStepper({ currentStatus }: StatusStepperProps) {
  const isFailed = currentStatus === "FAILED";

  /**
   * Gets the step state based on current status.
   */
  const getStepState = (
    stepId: SessionStatus
  ): "pending" | "active" | "completed" | "failed" => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStatus);
    const stepIndex = STEPS.findIndex((s) => s.id === stepId);

    if (isFailed) {
      if (stepIndex < currentIndex) return "completed";
      if (stepIndex === currentIndex) return "failed";
      return "pending";
    }

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  };

  return (
    <div className="space-y-1">
      {STEPS.map((step, index) => {
        const state = getStepState(step.id);
        const isLast = index === STEPS.length - 1;

        return (
          <div key={step.id} className="flex gap-4">
            {/* Icon and Line */}
            <div className="flex flex-col items-center">
              {/* Step Icon */}
              <div
                className={cn(
                  "status-step-icon",
                  state === "pending" && "status-step-icon--pending",
                  state === "active" && "status-step-icon--active",
                  state === "completed" && "status-step-icon--completed",
                  state === "failed" && "status-step-icon--failed"
                )}
              >
                {state === "completed" ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : state === "failed" ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : state === "active" ? (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                ) : (
                  <span className="text-xs">{index + 1}</span>
                )}
              </div>

              {/* Connecting Line */}
              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 h-12 -my-1",
                    state === "completed"
                      ? "bg-green-500"
                      : state === "failed"
                        ? "bg-red-500"
                        : "bg-white/20"
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className="pb-8">
              <p
                className={cn(
                  "font-medium",
                  state === "active" && "text-white",
                  state === "completed" && "text-green-400",
                  state === "failed" && "text-red-400",
                  state === "pending" && "text-white/50"
                )}
              >
                {step.label}
                {state === "active" && (
                  <span className="ml-2 loading-dots text-indigo-400" />
                )}
              </p>
              <p
                className={cn(
                  "text-sm",
                  state === "active"
                    ? "text-white/70"
                    : state === "failed"
                      ? "text-red-400/70"
                      : "text-white/40"
                )}
              >
                {state === "failed" ? "An error occurred" : step.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
