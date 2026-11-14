"use client";

import React, { useEffect, useState } from "react";
import type { ComponentType } from "react";
import type { DivIcon, LatLngExpression } from "leaflet";
import type { MapContainerProps, MarkerProps, TileLayerProps } from "react-leaflet";
import { LocateFixed, RotateCcw } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import "leaflet/dist/leaflet.css";

export interface PinPickerProps {
  value?: [number, number]; // [longitude, latitude]
  onChange: (coordinates: [number, number]) => void;
  defaultCenter?: [number, number]; // [longitude, latitude]
  className?: string;
}

export function PinPicker({
  value,
  onChange,
  defaultCenter = [74.1240, 15.2993], // Default Goa [lng, lat]
  className,
}: PinPickerProps) {
  const [mounted, setMounted] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Fallback manual inputs synced with incoming value
  const [prevValue, setPrevValue] = useState(value);
  const [manualLng, setManualLng] = useState<string>(value ? value[0].toString() : "");
  const [manualLat, setManualLat] = useState<string>(value ? value[1].toString() : "");

  if (value !== prevValue) {
    setPrevValue(value);
    setManualLng(value ? value[0].toString() : "");
    setManualLat(value ? value[1].toString() : "");
  }

  // Dynamic Leaflet components
  const [MapContainerComp, setMapContainerComp] = useState<ComponentType<MapContainerProps> | null>(null);
  const [TileLayerComp, setTileLayerComp] = useState<ComponentType<TileLayerProps> | null>(null);
  const [MarkerComp, setMarkerComp] = useState<ComponentType<MarkerProps> | null>(null);
  const [UseMapEventsComp, setUseMapEventsComp] = useState<ComponentType<{ onMapClick: (coords: [number, number]) => void }> | null>(null);
  const [customIcon, setCustomIcon] = useState<DivIcon | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    Promise.all([
      import("react-leaflet"),
      import("leaflet"),
    ]).then(([reactLeaflet, L]) => {
      if (!isSubscribed) return;

      setMapContainerComp(() => reactLeaflet.MapContainer);
      setTileLayerComp(() => reactLeaflet.TileLayer);
      setMarkerComp(() => reactLeaflet.Marker);

      // Map click handler wrapper
      function ClickHandler({ onMapClick }: { onMapClick: (coords: [number, number]) => void }) {
        reactLeaflet.useMapEvents({
          click(e) {
            onMapClick([Number(e.latlng.lng.toFixed(6)), Number(e.latlng.lat.toFixed(6))]);
          },
        });
        return null;
      }
      setUseMapEventsComp(() => ClickHandler);

      const pinSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="#1F5C4D">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      `;

      const icon = L.divIcon({
        className: "pin-picker-marker",
        html: pinSvg,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      setCustomIcon(icon);
      setMounted(true);
    });

    return () => {
      isSubscribed = false;
    };
  }, []);

  const handleUseCurrentLocation = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lng = Number(pos.coords.longitude.toFixed(6));
        const lat = Number(pos.coords.latitude.toFixed(6));
        onChange([lng, lat]);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError("Location permission denied. Please click on the map or enter coordinates.");
        } else {
          setLocationError("Could not retrieve your location. Please click on the map.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleReset = () => {
    onChange([defaultCenter[0], defaultCenter[1]]);
    setLocationError(null);
  };

  const handleManualApply = () => {
    const parsedLat = parseFloat(manualLat);
    const parsedLng = parseFloat(manualLng);
    if (
      !isNaN(parsedLat) &&
      !isNaN(parsedLng) &&
      parsedLat >= -90 &&
      parsedLat <= 90 &&
      parsedLng >= -180 &&
      parsedLng <= 180
    ) {
      onChange([Number(parsedLng.toFixed(6)), Number(parsedLat.toFixed(6))]);
      setLocationError(null);
    } else {
      setLocationError("Please enter valid latitude (-90 to 90) and longitude (-180 to 180).");
    }
  };

  const currentLng = value ? value[0] : defaultCenter[0];
  const currentLat = value ? value[1] : defaultCenter[1];
  const centerPosition: LatLngExpression = [currentLat, currentLng];

  return (
    <div className={clsx("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-medium text-(--ink)">
          {value ? (
            <span className="font-mono bg-(--paper) px-2 py-1 rounded border border-(--line)">
              Lat: {value[1].toFixed(5)}, Lng: {value[0].toFixed(5)}
            </span>
          ) : (
            <span className="text-(--ink-soft)">Tap map or drag pin to choose point</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleUseCurrentLocation}
            isLoading={isLocating}
          >
            <LocateFixed className="w-3.5 h-3.5 mr-1" />
            Use my location
          </Button>

          <Button
            type="button"
            variant="quiet"
            size="sm"
            onClick={handleReset}
            aria-label="Reset pin position"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Map display */}
      <div className="relative h-72 w-full overflow-hidden rounded-md border border-(--line) bg-(--paper)">
        {mounted && MapContainerComp && TileLayerComp && MarkerComp && customIcon && UseMapEventsComp ? (
          <MapContainerComp
            center={centerPosition}
            zoom={14}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%", zIndex: 10 }}
          >
            <TileLayerComp
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <UseMapEventsComp onMapClick={onChange} />
            <MarkerComp
              position={centerPosition}
              icon={customIcon}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const pos = marker.getLatLng();
                  onChange([Number(pos.lng.toFixed(6)), Number(pos.lat.toFixed(6))]);
                },
              }}
            />
          </MapContainerComp>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-(--ink-soft)">
            Loading map picker...
          </div>
        )}
      </div>

      {locationError && (
        <p role="alert" className="text-xs text-(--negative)">
          {locationError}
        </p>
      )}

      {/* Fallback keyboard coordinate inputs */}
      <div className="p-3 rounded-md bg-(--surface) border border-(--line) flex flex-col sm:flex-row items-center gap-2">
        <div className="flex-1 w-full flex items-center gap-2">
          <label htmlFor="manual-lat" className="text-xs font-semibold uppercase text-(--ink-soft) w-8">
            Lat
          </label>
          <input
            id="manual-lat"
            type="number"
            step="any"
            placeholder="15.2993"
            value={manualLat}
            onChange={(e) => setManualLat(e.target.value)}
            className="w-full text-xs font-mono p-2 rounded border border-(--line) bg-(--surface) text-(--ink)"
          />
        </div>

        <div className="flex-1 w-full flex items-center gap-2">
          <label htmlFor="manual-lng" className="text-xs font-semibold uppercase text-(--ink-soft) w-8">
            Lng
          </label>
          <input
            id="manual-lng"
            type="number"
            step="any"
            placeholder="74.1240"
            value={manualLng}
            onChange={(e) => setManualLng(e.target.value)}
            className="w-full text-xs font-mono p-2 rounded border border-(--line) bg-(--surface) text-(--ink)"
          />
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleManualApply}
          className="w-full sm:w-auto"
        >
          Set pin
        </Button>
      </div>
    </div>
  );
}
