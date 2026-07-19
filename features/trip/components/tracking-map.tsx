"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { GeoPoint } from "@/features/trip/schema";

/**
 * Leaflet tracking map (PRD §7.6) — styled to read like a production ride-hailing map:
 *   • CARTO Voyager tiles (light) / Dark Matter (dark) — the clean "app map" look; OSM's default
 *     raster reads as a hobby project. Free tiles, attribution kept.
 *   • The route is drawn Google/Uber-style: a casing line under an ink line, split at the car into
 *     a dimmed *travelled* leg and a solid *remaining* leg.
 *   • The driver is a pulsing amber badge with a top-view car glyph that ROTATES to the direction
 *     of travel (heading computed from consecutive pings) and an ETA chip riding above it.
 *   • Pickup = hollow ring, drop-off = rotated ink diamond — the same vocabulary as CoRouteLine,
 *     so cards and map speak one language.
 *
 * Rendered client-only via next/dynamic (ssr:false) from track-view, since Leaflet needs `window`.
 * `MapController.invalidateSize()` fixes the grey-tile bug (tile grid measured before the card
 * finishes layout); the marker glides between pings via `.trip-driver-marker` in globals.css.
 */
type LatLng = [number, number];

const AMBER = "#f4a726";

const TILES = {
  light: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
} as const;

/** Amber badge + white top-view car. The `.trip-car` span carries the heading rotation. */
const driverIcon = L.divIcon({
  className: "trip-driver-marker",
  html: `<div style="position:relative;width:34px;height:34px">
      <span class="co-pulse" style="position:absolute;inset:0;border-radius:9999px;background:${AMBER}"></span>
      <span class="trip-car" style="position:absolute;inset:2px;border-radius:9999px;background:${AMBER};border:2.5px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(26,29,36,.45)">
        <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#fff" d="M8.2 2.6h7.6c1.3 0 2.4 1.1 2.4 2.4v14c0 1.3-1.1 2.4-2.4 2.4H8.2c-1.3 0-2.4-1.1-2.4-2.4V5c0-1.3 1.1-2.4 2.4-2.4Z"/>
          <path fill="${AMBER}" d="M8.9 7.6h6.2l-.7 3H9.6Z"/>
          <path fill="${AMBER}" opacity=".65" d="M9.6 16.4h4.8l.7 2.4H8.9Z"/>
        </svg>
      </span>
    </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

/** Hollow-ring pickup / ink-diamond drop-off, matching CoRouteLine. Colours flip for dark tiles. */
function endpointIcons(dark: boolean) {
  const ink = dark ? "#faf8f4" : "#1a1d24";
  const fill = dark ? "#23272f" : "#ffffff";
  return {
    origin: L.divIcon({
      className: "",
      html: `<span style="display:block;width:15px;height:15px;border-radius:9999px;background:${fill};border:3.5px solid ${ink};box-shadow:0 1px 5px rgba(0,0,0,.35)"></span>`,
      iconSize: [15, 15],
      iconAnchor: [7.5, 7.5],
    }),
    destination: L.divIcon({
      className: "",
      html: `<span style="display:block;width:13px;height:13px;background:${ink};border:2.5px solid ${fill};transform:rotate(45deg);box-shadow:0 1px 5px rgba(0,0,0,.35)"></span>`,
      iconSize: [13, 13],
      iconAnchor: [6.5, 6.5],
    }),
  };
}

/** Split the route at the driver's nearest vertex → [travelled, remaining] legs. */
function splitRoute(line: LatLng[], driver: LatLng | null): { travelled: LatLng[]; remaining: LatLng[] } {
  if (!driver || line.length < 2) return { travelled: [], remaining: line };
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < line.length; i++) {
    const dx = line[i]![0] - driver[0];
    const dy = line[i]![1] - driver[1];
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return {
    travelled: [...line.slice(0, best + 1), driver],
    remaining: [driver, ...line.slice(best + 1)],
  };
}

/** Bearing between two points in degrees (0° = north), for the car glyph's rotation. */
function bearing(a: LatLng, b: LatLng): number {
  const toRad = Math.PI / 180;
  const dLng = (b[1] - a[1]) * toRad;
  const la1 = a[0] * toRad;
  const la2 = b[0] * toRad;
  const y = Math.sin(dLng) * Math.cos(la2);
  const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

/**
 * Owns every imperative map concern: fix the tile-grid size, fit the route once, then follow the car.
 * `driverLat/driverLng` are passed as primitives so the follow effect only fires on a real move.
 */
function MapController({
  fitPts,
  driverLat,
  driverLng,
}: {
  fitPts: LatLng[];
  driverLat: number | null;
  driverLng: number | null;
}) {
  const map = useMap();
  const fitted = useRef(false);

  // (1) The grey-tile fix — re-measure once layout settles, and on any container resize.
  useEffect(() => {
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

  // (2) Fit the route into view once — after a tick, so it fits the corrected size, not the stale one.
  useEffect(() => {
    if (fitted.current || fitPts.length === 0) return;
    fitted.current = true;
    const t = window.setTimeout(() => {
      if (fitPts.length >= 2) map.fitBounds(L.latLngBounds(fitPts), { padding: [56, 56], maxZoom: 15 });
      else map.setView(fitPts[0]!, 14);
    }, 140);
    return () => window.clearTimeout(t);
  }, [map, fitPts]);

  // (3) Keep the moving car in frame.
  useEffect(() => {
    if (driverLat != null && driverLng != null) map.panTo([driverLat, driverLng], { animate: true, duration: 0.8 });
  }, [map, driverLat, driverLng]);

  return null;
}

/** Rotates the car glyph toward the travel direction as pings arrive (no icon rebuild → the
 *  position glide in `.trip-driver-marker` is never interrupted). */
function DriverMarker({ position, etaMin }: { position: LatLng; etaMin: number | null }) {
  const ref = useRef<L.Marker | null>(null);
  const prev = useRef<LatLng | null>(null);
  const heading = useRef(0);

  useEffect(() => {
    const p = prev.current;
    // Ignore micro-jitter (< ~5 m) so the car doesn't spin while standing still.
    if (p && (Math.abs(p[0] - position[0]) > 5e-5 || Math.abs(p[1] - position[1]) > 5e-5)) {
      heading.current = bearing(p, position);
    }
    prev.current = position;
    const el = ref.current?.getElement()?.querySelector<HTMLElement>(".trip-car");
    if (el) el.style.transform = `rotate(${heading.current}deg)`;
  }, [position]);

  return (
    <Marker ref={ref} position={position} icon={driverIcon} zIndexOffset={500}>
      {etaMin != null ? (
        <Tooltip permanent direction="top" offset={[0, -22]} className="trip-eta-chip">
          {etaMin} min
        </Tooltip>
      ) : (
        <Tooltip direction="top" offset={[0, -20]}>
          Driver
        </Tooltip>
      )}
    </Marker>
  );
}

export function TrackingMap({
  origin,
  destination,
  driver,
  route,
  dark = false,
  etaMin = null,
}: {
  origin: GeoPoint;
  destination: GeoPoint;
  driver: LatLng | null;
  route: LatLng[] | null;
  dark?: boolean;
  etaMin?: number | null;
}) {
  const o: LatLng = [origin.lat, origin.lng];
  const d: LatLng = [destination.lat, destination.lng];
  const line: LatLng[] = route && route.length > 1 ? route : [o, d];
  const fitPts: LatLng[] = useMemo(() => (driver ? [o, d, driver] : [o, d]), [o, d, driver]);
  const { travelled, remaining } = useMemo(() => splitRoute(line, driver), [line, driver]);
  const icons = useMemo(() => endpointIcons(dark), [dark]);
  const tiles = dark ? TILES.dark : TILES.light;
  // Route palette — ink line over a contrast casing, flipped for dark tiles (Uber-style).
  const routeInk = dark ? "#e8eaf0" : "#1a1d24";
  const casing = dark ? "#15181e" : "#ffffff";

  return (
    <MapContainer center={o} zoom={12} scrollWheelZoom zoomControl={false} className="h-full w-full">
      <TileLayer key={dark ? "dark" : "light"} attribution={tiles.attribution} url={tiles.url} subdomains="abcd" />
      {/* casing under the whole line → crisp route edges over any tile colour */}
      <Polyline positions={line} pathOptions={{ color: casing, weight: 9, opacity: 0.9, lineCap: "round" }} />
      {travelled.length > 1 && (
        <Polyline positions={travelled} pathOptions={{ color: routeInk, weight: 4.5, opacity: 0.25, lineCap: "round" }} />
      )}
      <Polyline positions={remaining} pathOptions={{ color: routeInk, weight: 4.5, opacity: 0.95, lineCap: "round" }} />
      <Marker position={o} icon={icons.origin}>
        <Tooltip direction="top" offset={[0, -10]}>
          {origin.label} · pickup
        </Tooltip>
      </Marker>
      <Marker position={d} icon={icons.destination}>
        <Tooltip direction="top" offset={[0, -10]}>
          {destination.label} · drop-off
        </Tooltip>
      </Marker>
      {driver && <DriverMarker position={driver} etaMin={etaMin} />}
      <MapController fitPts={fitPts} driverLat={driver?.[0] ?? null} driverLng={driver?.[1] ?? null} />
    </MapContainer>
  );
}
