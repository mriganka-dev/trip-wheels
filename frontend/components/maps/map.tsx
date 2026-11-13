"use client";

import React, { useEffect, useState } from "react";
import type { ComponentType } from "react";
import type { DivIcon } from "leaflet";
import type { MapContainerProps, TileLayerProps, MarkerProps, PopupProps } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export interface MapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  label?: string;
  className?: string;
}

export function Map({
  latitude,
  longitude,
  zoom = 14,
  label,
  className = "h-64 w-full rounded-md",
}: MapProps) {
  const [mounted, setMounted] = useState(false);
  const [MapContainerComponent, setMapContainerComponent] = useState<ComponentType<MapContainerProps> | null>(null);
  const [TileLayerComponent, setTileLayerComponent] = useState<ComponentType<TileLayerProps> | null>(null);
  const [MarkerComponent, setMarkerComponent] = useState<ComponentType<MarkerProps> | null>(null);
  const [PopupComponent, setPopupComponent] = useState<ComponentType<PopupProps> | null>(null);
  const [customIcon, setCustomIcon] = useState<DivIcon | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    Promise.all([
      import("react-leaflet"),
      import("leaflet"),
    ]).then(([reactLeaflet, L]) => {
      if (!isSubscribed) return;

      setMapContainerComponent(() => reactLeaflet.MapContainer);
      setTileLayerComponent(() => reactLeaflet.TileLayer);
      setMarkerComponent(() => reactLeaflet.Marker);
      setPopupComponent(() => reactLeaflet.Popup);

      // Create an SVG-based pin in brand colour (#1F5C4D)
      const pinSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="#1F5C4D">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      `;

      const icon = L.divIcon({
        className: "custom-leaflet-marker",
        html: pinSvg,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      setCustomIcon(icon);
      setMounted(true);
    });

    return () => {
      isSubscribed = false;
    };
  }, []);

  if (!mounted || !MapContainerComponent || !TileLayerComponent || !MarkerComponent || !customIcon) {
    return (
      <div
        className={`${className} bg-(--paper) border border-(--line) flex items-center justify-center text-xs text-(--ink-soft)`}
      >
        Loading map area...
      </div>
    );
  }

  const MapContainer = MapContainerComponent;
  const TileLayer = TileLayerComponent;
  const Marker = MarkerComponent;
  const Popup = PopupComponent;

  return (
    <div className={`overflow-hidden border border-(--line) ${className}`}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", zIndex: 10 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]} icon={customIcon}>
          {label && Popup && <Popup>{label}</Popup>}
        </Marker>
      </MapContainer>
    </div>
  );
}
