"use client";

import React, { useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw, ExternalLink } from "lucide-react";
import { clsx } from "clsx";
import { Button } from "./button";

export interface ImageViewerProps {
  src: string;
  alt: string;
  className?: string;
  caption?: string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  src,
  alt,
  className,
  caption,
}) => {
  const [scale, setScale] = useState(1);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleReset = () => setScale(1);

  return (
    <div
      className={clsx(
        "flex flex-col bg-surface border border-line rounded overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-line bg-paper/50 text-xs">
        <span className="text-ink-soft font-medium truncate max-w-xs">{caption || alt}</span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="quiet"
            size="sm"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs text-ink-soft w-10 text-center select-none">
            {Math.round(scale * 100)}%
          </span>
          <Button
            type="button"
            variant="quiet"
            size="sm"
            onClick={handleZoomIn}
            disabled={scale >= 3}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="quiet"
            size="sm"
            onClick={handleReset}
            disabled={scale === 1}
            aria-label="Reset zoom"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-brand hover:text-brand-dark rounded hover:bg-brand-tint ml-1"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open in new tab</span>
          </a>
        </div>
      </div>

      <div className="relative overflow-auto max-h-[500px] flex items-center justify-center p-4 bg-paper/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            transition: "transform 150ms ease-out",
          }}
          className="max-w-full max-h-[460px] object-contain rounded"
        />
      </div>
    </div>
  );
};
