/**
 * ShopListEditor Component
 *
 * Allows users to add and manage the list of auto repair shops to contact.
 *
 * @module components/session/shop-list-editor
 */

"use client";

import { useState } from "react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Shop data structure.
 */
export type Shop = {
  id: string;
  name: string;
  phone: string;
  address?: string;
};

/**
 * Props for the ShopListEditor component.
 */
export type ShopListEditorProps = {
  /** Current list of shops */
  shops: Shop[];
  /** Callback when shop list changes */
  onChange: (shops: Shop[]) => void;
  /** Callback when user goes back */
  onBack: () => void;
  /** Callback when user proceeds to next step */
  onNext: () => void;
};

/**
 * ShopListEditor component for managing the list of shops to contact.
 *
 * @example
 * ```tsx
 * <ShopListEditor
 *   shops={formData.shops}
 *   onChange={(shops) => setFormData({ ...formData, shops })}
 *   onBack={() => setStep("damage")}
 *   onNext={() => setStep("review")}
 * />
 * ```
 */
export function ShopListEditor({
  shops,
  onChange,
  onBack,
  onNext,
}: ShopListEditorProps) {
  const [newShop, setNewShop] = useState<Omit<Shop, "id">>({
    name: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [addError, setAddError] = useState<string | null>(null);

  /**
   * Validates and formats phone number.
   */
  const formatPhone = (phone: string): string => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, "");
    
    // Add +1 prefix if not present and has 10 digits
    if (digits.length === 10) {
      return `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith("1")) {
      return `+${digits}`;
    }
    
    return phone;
  };

  /**
   * Validates phone number format.
   */
  const isValidPhone = (phone: string): boolean => {
    const formatted = formatPhone(phone);
    return /^\+[1-9]\d{6,14}$/.test(formatted);
  };

  /**
   * Adds a new shop to the list.
   */
  const handleAddShop = () => {
    setAddError(null);

    if (!newShop.name.trim()) {
      setAddError("Shop name is required");
      return;
    }

    if (!newShop.phone.trim()) {
      setAddError("Phone number is required");
      return;
    }

    if (!isValidPhone(newShop.phone)) {
      setAddError("Please enter a valid phone number");
      return;
    }

    if (shops.length >= 10) {
      setAddError("Maximum 10 shops allowed");
      return;
    }

    const shop: Shop = {
      id: nanoid(),
      name: newShop.name.trim(),
      phone: formatPhone(newShop.phone),
    };

    onChange([...shops, shop]);
    setNewShop({ name: "", phone: "" });
  };

  /**
   * Removes a shop from the list.
   */
  const handleRemoveShop = (id: string) => {
    onChange(shops.filter((shop) => shop.id !== id));
  };

  /**
   * Validates and proceeds to next step.
   */
  const handleNext = () => {
    const newErrors: Record<string, string> = {};

    if (shops.length === 0) {
      newErrors.shops = "Please add at least one shop";
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
          Select Repair Shops
        </h2>
        <p className="text-white/60 text-sm">
          Add the auto repair shops you want to get quotes from (up to 10).
        </p>
      </div>

      {/* Add New Shop Form */}
      <div className="p-4 border border-white/10 rounded-lg space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="shop-name" className="text-white">
              Shop Name
            </Label>
            <Input
              id="shop-name"
              placeholder="e.g., Joe's Auto Body"
              value={newShop.name}
              onChange={(e) => setNewShop({ ...newShop, name: e.target.value })}
              className="glass-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shop-phone" className="text-white">
              Phone Number
            </Label>
            <Input
              id="shop-phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={newShop.phone}
              onChange={(e) => setNewShop({ ...newShop, phone: e.target.value })}
              className="glass-input"
            />
          </div>
        </div>

        {addError && <p className="text-red-400 text-sm">{addError}</p>}

        <Button
          onClick={handleAddShop}
          variant="outline"
          className="w-full border-white/20 text-white hover:bg-white/10"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Shop
        </Button>
      </div>

      {/* Shop List */}
      {shops.length > 0 ? (
        <div className="space-y-3">
          <Label className="text-white">
            Shops to Contact ({shops.length}/10)
          </Label>
          <div className="space-y-2">
            {shops.map((shop, index) => (
              <div
                key={shop.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-white font-medium">{shop.name}</p>
                    <p className="text-white/60 text-sm">{shop.phone}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveShop(shop.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-white/40">
          <svg
            className="w-12 h-12 mx-auto mb-3 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <p>No shops added yet</p>
        </div>
      )}

      {errors.shops && (
        <p className="text-red-400 text-sm text-center">{errors.shops}</p>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <Button
          onClick={onBack}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          className="bg-indigo-500 hover:bg-indigo-600 text-white"
        >
          Next: Review
        </Button>
      </div>
    </div>
  );
}
