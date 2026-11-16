"use client";

import React, { useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { clsx } from "clsx";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export interface LocationPickerProps {
  value?: [number, number]; // [longitude, latitude]
  onChange: (coords: [number, number]) => void;
  label?: string;
  className?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  label = "Location (Coordinates)",
  className,
}) => {
  const [latInput, setLatInput] = useState<string>(
    value && typeof value[1] === "number" ? value[1].toString() : ""
  );
  const [lngInput, setLngInput] = useState<string>(
    value && typeof value[0] === "number" ? value[0].toString() : ""
  );

  const latNum = parseFloat(latInput);
  const lngNum = parseFloat(lngInput);

  const isValid =
    !isNaN(latNum) &&
    !isNaN(lngNum) &&
    latNum >= -90 &&
    latNum <= 90 &&
    lngNum >= -180 &&
    lngNum <= 180 &&
    !(latNum === 0 && lngNum === 0);

  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLatInput(val);
    const parsedLat = parseFloat(val);
    const parsedLng = parseFloat(lngInput);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      onChange([parsedLng, parsedLat]);
    }
  };

  const handleLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLngInput(val);
    const parsedLng = parseFloat(val);
    const parsedLat = parseFloat(latInput);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      onChange([parsedLng, parsedLat]);
    }
  };

  const delta = 0.01;
  const embedUrl = isValid
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lngNum - delta}%2C${latNum - delta}%2C${lngNum + delta}%2C${latNum + delta}&layer=mapnik&marker=${latNum}%2C${lngNum}`
    : null;

  return (
    <div className={clsx("space-y-3", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Latitude" hint="Between -90 and 90" required>
          <Input
            type="number"
            step="any"
            value={latInput}
            onChange={handleLatChange}
            placeholder="e.g. 21.6266"
          />
        </Field>

        <Field label="Longitude" hint="Between -180 and 180" required>
          <Input
            type="number"
            step="any"
            value={lngInput}
            onChange={handleLngChange}
            placeholder="e.g. 87.5113"
          />
        </Field>
      </div>

      {isValid && embedUrl ? (
        <div className="bg-surface border border-line rounded overflow-hidden">
          <div className="relative w-full h-48 bg-paper">
            <iframe
              title={label}
              src={embedUrl}
              className="w-full h-full border-0 select-none"
              loading="lazy"
            />
          </div>
          <div className="flex items-center justify-between px-3 py-1.5 bg-paper/60 border-t border-line text-xs">
            <span className="font-mono text-ink-soft">
              Pin set at {latNum.toFixed(5)}, {lngNum.toFixed(5)}
            </span>
            <a
              href={`https://www.openstreetmap.org/?mlat=${latNum}&mlon=${lngNum}#map=15/${latNum}/${lngNum}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-brand hover:underline font-medium"
            >
              <span>View OpenStreetMap</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      ) : (
        <div className="bg-paper border border-line rounded p-4 text-center text-xs text-ink-soft">
          <MapPin className="w-4 h-4 mx-auto text-ink-soft/60 mb-1" />
          Enter valid latitude and longitude to preview the location pin on the map.
        </div>
      )}
    </div>
  );
};
