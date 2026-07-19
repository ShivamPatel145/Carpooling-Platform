"use client";

import * as React from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { route as osrmRoute, haversineKm, type LineString } from "@/lib/osrm";
import type { RouteMapProps, LatLngPoint } from "./types";

/**
 * RouteMap implementation (Leaflet + react-leaflet). Loaded ONLY on the client via the dynamic
 * wrapper in RouteMap.tsx (Leaflet touches `window` at import — it must never SSR).
 *
 * Rendering priority for the route line:
 *   1. `routeGeoJSON` prop (cached on the ride row from OSRM) — instant, no network.
 *   2. otherwise fetch OSRM once on mount.
 *   3. if OSRM fails → straight line between the two points + crow-flies distance. NEVER blank.
 *
 * `vehiclePosition` (optional) renders a live amber marker Slice B moves for trip tracking.
 *
 * Markers use Leaflet divIcons (inline SVG) rather than the default PNG marker assets, which break
 * under bundlers — this keeps the map self-contained with no external image requests.
 */

const BRAND_AMBER = "#F4A726";

/** Convert a GeoJSON LineString ([lng,lat][]) to Leaflet LatLng tuples ([lat,lng][]). */
function geoJsonToLatLngs(line: LineString): [number, number][] {
  return line.coordinates.map(([lng, lat]) => [lat, lng]);
}

/** A coloured teardrop pin as a divIcon (no external asset). */
function pinIcon(color: string, label: string) {
  return L.divIcon({
    className: "route-map-pin",
    html: `<svg width="28" height="40" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg" aria-label="${label}">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 9.8 12.2 24.6 12.7 25.2a1.7 1.7 0 0 0 2.6 0C15.8 38.6 28 23.8 28 14 28 6.27 21.73 0 14 0z" fill="${color}"/>
      <circle cx="14" cy="14" r="5.5" fill="#ffffff"/>
    </svg>`,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -38],
  });
}

/** The live vehicle marker — brand amber, a car glyph, subtle ring. Slice B moves it. */
function vehicleIcon() {
  return L.divIcon({
    className: "route-map-vehicle",
    html: `<div style="position:relative;width:34px;height:34px">
      <span style="position:absolute;inset:0;border-radius:9999px;background:${BRAND_AMBER};opacity:.25"></span>
      <span style="position:absolute;inset:5px;border-radius:9999px;background:${BRAND_AMBER};display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.35)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#231703" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 17H3v-5l2-4h9l4 4h2a1 1 0 0 1 1 1v4h-2"/><circle cx="7.5" cy="17.5" r="1.6"/><circle cx="17.5" cy="17.5" r="1.6"/>
        </svg>
      </span>
    </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
  });
}

const originIcon = () => pinIcon("#0f766e", "Pickup"); // teal-ish start (not the brand accent)
const destIcon = () => pinIcon("#dc2626", "Destination"); // red end

/**
 * Re-measure the tile grid once layout settles. Leaflet sizes its tiles against the container at
 * mount; inside a card/flex/animated shell that size is briefly wrong and tiles never fill (the
 * grey-gap bug). Re-invalidate next frame, on a couple of short delays, and on any container resize.
 */
function InvalidateSize() {
  const map = useMap();
  React.useEffect(() => {
    const invalidate = () => map.invalidateSize({ animate: false });
    const raf = requestAnimationFrame(invalidate);
    const timers = [80, 250, 600].map((ms) => window.setTimeout(invalidate, ms));
    const ro = new ResizeObserver(invalidate);
    ro.observe(map.getContainer());
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
      ro.disconnect();
    };
  }, [map]);
  return null;
}

/** Imperatively fit the map to all relevant points whenever they change. */
function FitBounds({ points }: { points: (LatLngPoint | null)[] }) {
  const map = useMap();
  React.useEffect(() => {
    const valid = points.filter((p): p is LatLngPoint => Boolean(p));
    if (valid.length === 0) return;
    if (valid.length === 1) {
      map.setView([valid[0]!.lat, valid[0]!.lng], 14);
      return;
    }
    const bounds = L.latLngBounds(valid.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
  }, [map, points]);
  return null;
}

export default function RouteMapImpl({
  origin,
  destination,
  vehiclePosition,
  routeGeoJSON,
  className,
  height = 360,
  interactive = true,
}: RouteMapProps) {
  // Resolved polyline points ([lat,lng][]) and whether we're on the straight-line fallback.
  const [line, setLine] = React.useState<[number, number][] | null>(
    routeGeoJSON ? geoJsonToLatLngs(routeGeoJSON) : null,
  );
  const [degraded, setDegraded] = React.useState(false);

  React.useEffect(() => {
    // If the ride already carries cached geometry, use it and skip the network entirely.
    if (routeGeoJSON) {
      setLine(geoJsonToLatLngs(routeGeoJSON));
      setDegraded(false);
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      const result = await osrmRoute(origin, destination, { signal: controller.signal });
      if (cancelled) return;
      if (result) {
        setLine(geoJsonToLatLngs(result.geometry));
        setDegraded(false);
      } else {
        // GRACEFUL DEGRADATION: straight line between the two points.
        setLine([
          [origin.lat, origin.lng],
          [destination.lat, destination.lng],
        ]);
        setDegraded(true);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [origin, destination, routeGeoJSON]);

  const crowKm = React.useMemo(() => haversineKm(origin, destination), [origin, destination]);
  const center: [number, number] = [
    (origin.lat + destination.lat) / 2,
    (origin.lng + destination.lng) / 2,
  ];

  return (
    <div
      className={className}
      style={{ height, width: "100%", borderRadius: 8, overflow: "hidden" }}
    >
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        zoomControl={interactive}
        attributionControl
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {line && (
          <Polyline
            positions={line}
            pathOptions={{
              color: degraded ? "#94a3b8" : BRAND_AMBER,
              weight: 5,
              opacity: 0.9,
              dashArray: degraded ? "8 8" : undefined,
            }}
          />
        )}

        <Marker position={[origin.lat, origin.lng]} icon={originIcon()}>
          <Popup>{origin.label ?? "Pickup"}</Popup>
        </Marker>
        <Marker position={[destination.lat, destination.lng]} icon={destIcon()}>
          <Popup>{destination.label ?? "Destination"}</Popup>
        </Marker>

        {vehiclePosition && (
          <Marker position={[vehiclePosition.lat, vehiclePosition.lng]} icon={vehicleIcon()}>
            <Popup>{vehiclePosition.label ?? "Vehicle"}</Popup>
          </Marker>
        )}

        <InvalidateSize />
        <FitBounds points={[origin, destination, vehiclePosition ?? null]} />
      </MapContainer>

      {degraded && (
        <div className="pointer-events-none -mt-7 flex justify-center">
          <span className="pointer-events-auto rounded-full border bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur">
            Route preview unavailable — showing straight-line distance ≈ {crowKm} km
          </span>
        </div>
      )}
    </div>
  );
}
