/**
 * New Session Page
 *
 * Multi-step form for creating a new quote session.
 *
 * @module app/session/new/page
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { GlassCard } from "@/components/glass/glass-card";
import { DamageForm, type DamageFormData } from "@/components/session/damage-form";
import { ShopListEditor, type Shop } from "@/components/session/shop-list-editor";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Form step type.
 */
type FormStep = "damage" | "shops" | "review";

/**
 * Complete form data structure.
 */
type FormData = DamageFormData & {
  shops: Shop[];
};

/**
 * NewSessionPage component for creating a new quote session.
 */
export default function NewSessionPage() {
  const { user, isLoading: authLoading } = useUser();
  const router = useRouter();
  const [step, setStep] = useState<FormStep>("damage");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    location: "",
    vehicle: { make: "", model: "", year: undefined },
    description_raw: "",
    image_keys: [],
    shops: [],
  });

  // Redirect to login if not authenticated
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <GlassCard className="max-w-md mx-auto text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-white/10 rounded w-3/4 mx-auto mb-4" />
            <div className="h-4 bg-white/10 rounded w-1/2 mx-auto" />
          </div>
        </GlassCard>
      </div>
    );
  }

  if (!user) {
    router.push("/api/auth/login");
    return null;
  }

  /**
   * Handles form submission.
   */
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/v1/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create session");
      }

      const { session_id } = await response.json();
      toast.success("Session created! Starting quote process...");
      router.push(`/session/${session_id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create session"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Updates form data.
   */
  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            New Quote Request
          </h1>
          <p className="text-white/60">
            Tell us about the damage and select shops to contact.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(["damage", "shops", "review"] as FormStep[]).map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step === s
                    ? "bg-indigo-500 text-white"
                    : i < ["damage", "shops", "review"].indexOf(step)
                      ? "bg-green-500 text-white"
                      : "bg-white/10 text-white/50"
                }`}
              >
                {i < ["damage", "shops", "review"].indexOf(step) ? "✓" : i + 1}
              </div>
              {i < 2 && (
                <div
                  className={`w-12 h-0.5 mx-1 ${
                    i < ["damage", "shops", "review"].indexOf(step)
                      ? "bg-green-500"
                      : "bg-white/20"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Steps */}
        <GlassCard>
          {step === "damage" && (
            <DamageForm
              data={formData}
              onChange={updateFormData}
              onNext={() => setStep("shops")}
            />
          )}

          {step === "shops" && (
            <ShopListEditor
              shops={formData.shops}
              onChange={(shops) => updateFormData({ shops })}
              onBack={() => setStep("damage")}
              onNext={() => setStep("review")}
            />
          )}

          {step === "review" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">
                  Review Your Request
                </h2>
                <p className="text-white/60 text-sm">
                  Make sure everything looks correct before starting.
                </p>
              </div>

              {/* Summary */}
              <div className="space-y-4">
                {/* Location */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-white/60 text-xs uppercase tracking-wide mb-1">
                    Location
                  </h3>
                  <p className="text-white">{formData.location}</p>
                </div>

                {/* Vehicle */}
                {formData.vehicle.make && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-white/60 text-xs uppercase tracking-wide mb-1">
                      Vehicle
                    </h3>
                    <p className="text-white">
                      {formData.vehicle.year} {formData.vehicle.make}{" "}
                      {formData.vehicle.model}
                    </p>
                  </div>
                )}

                {/* Damage Description */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-white/60 text-xs uppercase tracking-wide mb-1">
                    Damage Description
                  </h3>
                  <p className="text-white text-sm">{formData.description_raw}</p>
                </div>

                {/* Shops */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-white/60 text-xs uppercase tracking-wide mb-2">
                    Shops to Contact ({formData.shops.length})
                  </h3>
                  <div className="space-y-2">
                    {formData.shops.map((shop) => (
                      <div
                        key={shop.id}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-white">{shop.name}</span>
                        <span className="text-white/60">{shop.phone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4">
                <Button
                  onClick={() => setStep("shops")}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
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
                      Creating...
                    </span>
                  ) : (
                    "Create Quote Request"
                  )}
                </Button>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
