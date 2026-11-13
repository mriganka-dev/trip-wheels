"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import type { VehicleImage } from "@/types/vehicle";

export interface VehicleGalleryProps {
  images: VehicleImage[];
  title: string;
}

export function VehicleGallery({ images, title }: VehicleGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const validImages = images && images.length > 0 ? images : [];
  const currentImage = validImages[selectedIndex];

  const handlePrevious = useCallback(() => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : validImages.length - 1));
  }, [validImages.length]);

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev < validImages.length - 1 ? prev + 1 : 0));
  }, [validImages.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (validImages.length <= 1) return;
      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrevious, handleNext, validImages.length]);

  if (validImages.length === 0) {
    return (
      <div className="w-full h-72 sm:h-96 rounded-md bg-(--paper) border border-(--line) flex items-center justify-center p-6 text-center">
        <span className="font-display font-semibold text-sm text-(--ink-soft)">
          {title}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Large main image container */}
      <div className="relative w-full h-72 sm:h-[420px] rounded-md overflow-hidden bg-(--paper) border border-(--line)">
        <Image
          src={currentImage.url}
          alt={`${title} - Photo ${selectedIndex + 1} of ${validImages.length}`}
          fill
          priority={selectedIndex === 0}
          sizes="(max-width: 1024px) 100vw, 768px"
          className="object-cover"
        />

        {/* Mobile / touch arrow navigation */}
        {validImages.length > 1 && (
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none">
            <button
              type="button"
              onClick={handlePrevious}
              aria-label="Previous photo"
              className="pointer-events-auto p-2 rounded-full bg-(--surface) text-(--ink) border border-(--line) shadow-xs hover:bg-(--paper) focus-visible:outline-2 focus-visible:outline-(--brand)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next photo"
              className="pointer-events-auto p-2 rounded-full bg-(--surface) text-(--ink) border border-(--line) shadow-xs hover:bg-(--paper) focus-visible:outline-2 focus-visible:outline-(--brand)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Photo count indicator */}
        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[11px] px-2.5 py-1 rounded select-none">
          {selectedIndex + 1} / {validImages.length}
        </div>
      </div>

      {/* Desktop thumbnails */}
      {validImages.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {validImages.map((img, index) => {
            const isSelected = index === selectedIndex;
            return (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-label={`View photo ${index + 1}`}
                className={clsx(
                  "relative w-20 h-16 rounded overflow-hidden shrink-0 border transition-all cursor-pointer",
                  isSelected
                    ? "border-(--brand) ring-2 ring-(--brand)/20"
                    : "border-(--line) opacity-70 hover:opacity-100"
                )}
              >
                <Image
                  src={img.url}
                  alt={`${title} thumbnail ${index + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

