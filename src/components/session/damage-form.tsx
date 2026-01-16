/**
 * DamageForm Component
 *
 * Form for collecting damage information including location, vehicle details,
 * damage description, and optional image upload.
 *
 * @module components/session/damage-form
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "./image-upload";

/**
 * Form data structure for damage information.
 */
export type DamageFormData = {
  location: string;
  vehicle: {
    make: string;
    model: string;
    year: number | undefined;
  };
  description_raw: string;
  image_keys: string[];
};

/**
 * Props for the DamageForm component.
 */
export type DamageFormProps = {
  /** Current form data */
  data: DamageFormData;
  /** Callback when form data changes */
  onChange: (updates: Partial<DamageFormData>) => void;
  /** Callback when user proceeds to next step */
  onNext: () => void;
};

/**
 * DamageForm component for collecting damage information.
 *
 * @example
 * ```tsx
 * <DamageForm
 *   data={formData}
 *   onChange={(updates) => setFormData({ ...formData, ...updates })}
 *   onNext={() => setStep("shops")}
 * />
 * ```
 */
export function DamageForm({ data, onChange, onNext }: DamageFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Validates the form and proceeds to next step if valid.
   */
  const handleNext = () => {
    const newErrors: Record<string, string> = {};

    if (!data.location.trim()) {
      newErrors.location = "Location is required";
    }

    if (!data.description_raw.trim()) {
      newErrors.description_raw = "Damage description is required";
    } else if (data.description_raw.trim().length < 10) {
      newErrors.description_raw = "Please provide at least 10 characters";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">
          Describe the Damage
        </h2>
        <p className="text-white/60 text-sm">
          Tell us about your vehicle and the damage you need repaired.
        </p>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location" className="text-white">
          Location (ZIP or City) *
        </Label>
        <Input
          id="location"
          type="text"
          placeholder="e.g., 90210 or Los Angeles, CA"
          value={data.location}
          onChange={(e) => onChange({ location: e.target.value })}
          className="glass-input"
        />
        {errors.location && (
          <p className="text-red-400 text-sm">{errors.location}</p>
        )}
      </div>

      {/* Vehicle Information */}
      <div className="space-y-4">
        <Label className="text-white">Vehicle Information (Optional)</Label>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Input
              placeholder="Make (e.g., Toyota)"
              value={data.vehicle.make}
              onChange={(e) =>
                onChange({
                  vehicle: { ...data.vehicle, make: e.target.value },
                })
              }
              className="glass-input"
            />
          </div>
          <div>
            <Input
              placeholder="Model (e.g., Camry)"
              value={data.vehicle.model}
              onChange={(e) =>
                onChange({
                  vehicle: { ...data.vehicle, model: e.target.value },
                })
              }
              className="glass-input"
            />
          </div>
          <div>
            <Input
              type="number"
              placeholder="Year"
              value={data.vehicle.year || ""}
              onChange={(e) =>
                onChange({
                  vehicle: {
                    ...data.vehicle,
                    year: e.target.value ? parseInt(e.target.value) : undefined,
                  },
                })
              }
              className="glass-input"
            />
          </div>
        </div>
      </div>

      {/* Damage Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-white">
          Damage Description *
        </Label>
        <Textarea
          id="description"
          placeholder="Describe the damage in detail. For example: 'There's a large dent on the front passenger door from a shopping cart, about 6 inches wide. The paint is scratched but not chipped through to the metal.'"
          value={data.description_raw}
          onChange={(e) => onChange({ description_raw: e.target.value })}
          rows={5}
          className="glass-input resize-none"
        />
        {errors.description_raw && (
          <p className="text-red-400 text-sm">{errors.description_raw}</p>
        )}
        <p className="text-white/40 text-xs">
          {data.description_raw.length} characters
        </p>
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <Label className="text-white">Photo of Damage (Optional)</Label>
        <ImageUpload
          imageKeys={data.image_keys}
          onUpload={(keys) => onChange({ image_keys: keys })}
        />
        <p className="text-white/40 text-xs">
          Upload a clear photo of the damage for a more accurate quote.
        </p>
      </div>

      {/* Next Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleNext}
          className="bg-indigo-500 hover:bg-indigo-600 text-white"
        >
          Next: Select Shops
        </Button>
      </div>
    </div>
  );
}
