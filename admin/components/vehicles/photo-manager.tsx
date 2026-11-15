"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { Camera, ImageOff, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteVehicleImage, uploadVehicleImages } from "@/lib/api/vehicles";
import { useToast } from "@/components/ui/toast";
import type { Vehicle, VehicleImage } from "@/types/vehicle";

interface PhotoManagerProps {
  vehicle: Vehicle;
  onVehicleUpdated: (updated: Vehicle) => void;
  disabled?: boolean;
}

export function PhotoManager({
  vehicle,
  onVehicleUpdated,
  disabled = false,
}: PhotoManagerProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  const images = vehicle.images || [];
  const count = images.length;
  const minNeeded = 3;
  const maxAllowed = 10;
  const canUploadMore = count < maxAllowed && !disabled;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Reset input so same files can be re-selected if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (count + files.length > maxAllowed) {
      showToast(
        `A vehicle can have at most ${maxAllowed} photos. You can upload ${maxAllowed - count} more.`,
        "warning"
      );
      return;
    }

    // Validate size and type
    const validFiles: File[] = [];
    for (const file of files) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        showToast(
          `"${file.name}" is not a supported image format. Please use JPG, PNG, or WEBP.`,
          "negative"
        );
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast(
          `"${file.name}" exceeds the 5 MB file size limit.`,
          "negative"
        );
        return;
      }
      validFiles.push(file);
    }

    setIsUploading(true);
    try {
      const updated = await uploadVehicleImages(vehicle._id, validFiles);
      onVehicleUpdated(updated);
      showToast(
        `${validFiles.length} photo${validFiles.length === 1 ? "" : "s"} uploaded successfully.`,
        "brand"
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload photos.";
      showToast(message, "negative");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (image: VehicleImage) => {
    const imageId = image._id || image.publicId;
    if (!imageId || disabled) return;

    setDeletingImageId(imageId);
    try {
      const updated = await deleteVehicleImage(vehicle._id, imageId);
      onVehicleUpdated(updated);
      showToast("Photo removed.", "neutral");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete photo.";
      showToast(message, "negative");
    } finally {
      setDeletingImageId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Guidance block */}
      <div className="p-4 rounded-md border border-(--line) bg-(--paper)">
        <p className="text-xs text-(--ink-soft) leading-relaxed">
          Add clear photos of the front, back, both sides, the odometer and the
          number plate. Customers compare the vehicle with these photos at
          pickup.
        </p>
        <div className="mt-2 flex items-center justify-between text-xs font-medium">
          <span
            className={
              count < minNeeded
                ? "text-(--negative) font-semibold"
                : "text-(--brand) font-semibold"
            }
          >
            {count} of {maxAllowed} added
            {count < minNeeded ? `, at least ${minNeeded} needed` : ""}
          </span>
          <span className="text-(--ink-soft)">JPG, PNG or WEBP up to 5 MB each</span>
        </div>
      </div>

      {/* Upload button & hidden input */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={!canUploadMore || isUploading}
          onChange={handleFileChange}
          className="hidden"
          id="vehicle-photo-upload"
        />
        <Button
          type="button"
          variant="secondary"
          size="md"
          disabled={!canUploadMore || isUploading}
          isLoading={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="w-full sm:w-auto"
        >
          <Camera className="w-4 h-4 mr-2" />
          {count === 0 ? "Upload photos" : "Add more photos"}
        </Button>
      </div>

      {/* Photos Grid */}
      {count === 0 ? (
        <div className="p-8 text-center rounded-md border border-dashed border-(--line) bg-(--surface) flex flex-col items-center justify-center gap-2">
          <ImageOff className="w-8 h-8 text-(--ink-soft)" />
          <p className="text-sm font-medium text-(--ink)">No photos added yet</p>
          <p className="text-xs text-(--ink-soft)">
            At least 3 photos are required before submitting for review.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, idx) => {
            const imageId = img._id || img.publicId;
            const isDeleting = deletingImageId === imageId;
            const isMain = idx === 0;

            return (
              <div
                key={imageId}
                className="group relative aspect-4/3 rounded-md overflow-hidden border border-(--line) bg-(--paper)"
              >
                <Image
                  src={img.url}
                  alt={`${vehicle.brand} ${vehicle.model} photo ${idx + 1}`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  className="object-cover"
                />

                {/* Badge for main photo */}
                {isMain && (
                  <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-(--brand) text-white shadow-xs">
                    Main photo
                  </div>
                )}

                {/* Actions overlay */}
                {!disabled && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex items-center justify-center p-2">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleDelete(img)}
                      className="p-2 rounded-full bg-(--surface) text-(--negative) hover:bg-(--surface)/90 transition-colors shadow-xs"
                      aria-label={`Remove photo ${idx + 1}`}
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
