"use client";

import React from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { clsx } from "clsx";

export interface OsmMapProps {
  latitude: number;
  longitude: number;
  label?: string;
  className?: string;
}

export const OsmMap: React.FC<OsmMapProps> = ({
  latitude,
  longitude,
  label,
  className,
}) => {
  const hasValidCoords =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    !(latitude === 0 && longitude === 0) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  if (!hasValidCoords) {
    return (
      <div
        className={clsx(
          "bg-paper border border-line rounded p-4 text-center text-xs text-ink-soft",
          className
        )}
      >
        <MapPin className="w-5 h-5 mx-auto text-ink-soft/60 mb-1" />
        No valid coordinates recorded for this location.
      </div>
    );
  }

  const delta = 0.008;
  const bbox = `${longitude - delta}%2C${latitude - delta}%2C${longitude + delta}%2C${latitude + delta}`;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  const directUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;

  return (
    <div
      className={clsx(
        "flex flex-col bg-surface border border-line rounded overflow-hidden",
        className
      )}
    >
      <div className="relative w-full h-56 sm:h-64 bg-paper">
        <iframe
          title={label || "Pickup Location Map"}
          src={embedUrl}
          className="w-full h-full border-0 select-none"
          loading="lazy"
        />
      </div>

      <div className="flex items-center justify-between px-3 py-2 bg-paper/60 border-t border-line text-xs">
        <div className="font-mono text-ink-soft">
          Lat: {latitude.toFixed(5)}, Lon: {longitude.toFixed(5)}
        </div>
        <a
          href={directUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-brand hover:underline font-medium"
        >
          <span>Open map</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
