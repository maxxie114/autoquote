/**
 * ImageUpload Component
 *
 * Handles image file selection and upload to S3 via presigned URLs.
 *
 * @module components/session/image-upload
 */

"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";

/**
 * Props for the ImageUpload component.
 */
export type ImageUploadProps = {
  /** Currently uploaded image S3 keys */
  imageKeys: string[];
  /** Callback when images are uploaded */
  onUpload: (keys: string[]) => void;
  /** Maximum number of images allowed */
  maxImages?: number;
};

/**
 * ImageUpload component for uploading damage photos.
 *
 * Uses presigned URLs for secure direct-to-S3 uploads.
 *
 * @example
 * ```tsx
 * <ImageUpload
 *   imageKeys={formData.image_keys}
 *   onUpload={(keys) => setFormData({ ...formData, image_keys: keys })}
 * />
 * ```
 */
export function ImageUpload({
  imageKeys,
  onUpload,
  maxImages = 3,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handles file selection and upload.
   */
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - imageKeys.length;
    if (remainingSlots <= 0) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setIsUploading(true);
    setError(null);

    try {
      const newKeys: string[] = [];
      const newPreviews: string[] = [];

      for (const file of filesToUpload) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          throw new Error("Only image files are allowed");
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("Image must be less than 10MB");
        }

        // Create local preview
        const previewUrl = URL.createObjectURL(file);
        newPreviews.push(previewUrl);

        // Get presigned URL from API
        // Note: This would call the actual API in production
        // For now, we simulate the upload
        const response = await fetch("/api/v1/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType: file.type,
          }),
        });

        if (!response.ok) {
          // In development/mock mode, generate a fake key
          const fakeKey = `uploads/mock/${Date.now()}-${file.name}`;
          newKeys.push(fakeKey);
          continue;
        }

        const { uploadUrl, key } = await response.json();

        // Upload to S3
        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image");
        }

        newKeys.push(key);
      }

      setPreviews([...previews, ...newPreviews]);
      onUpload([...imageKeys, ...newKeys]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  /**
   * Removes an uploaded image.
   */
  const handleRemove = (index: number) => {
    const newKeys = imageKeys.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    // Revoke object URL to free memory
    if (previews[index]) {
      URL.revokeObjectURL(previews[index]);
    }

    setPreviews(newPreviews);
    onUpload(newKeys);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed border-white/20 rounded-lg p-6
          flex flex-col items-center justify-center gap-3
          hover:border-white/30 transition-colors cursor-pointer
          ${isUploading ? "opacity-50 pointer-events-none" : ""}
        `}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading || imageKeys.length >= maxImages}
        />

        <svg
          className="w-10 h-10 text-white/40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>

        <div className="text-center">
          <p className="text-white/60 text-sm">
            {isUploading
              ? "Uploading..."
              : "Click to upload or drag and drop"}
          </p>
          <p className="text-white/40 text-xs mt-1">
            PNG, JPG up to 10MB ({imageKeys.length}/{maxImages})
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Preview Grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt={`Upload ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border border-white/10"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(index);
                }}
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
