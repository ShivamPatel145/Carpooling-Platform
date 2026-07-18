/**
 * OSRM routing helper — public demo server (router.project-osrm.org), no API key (build-day
 * constraint). Used two ways:
 *   • server-side in the Offer-a-Ride API to CACHE routeGeoJSON/distanceKm/durationMin on the ride
 *     row so we never re-route per view;
 *   • client-side in RouteMap as a fallback when a ride has no cached geometry.
 *
 * GRACEFUL DEGRADATION is the contract: if OSRM is slow, errors, or rate-limits, `route()` resolves
 * to `null`. Callers then draw a straight line between the two points and show the crow-flies
 * (haversine) distance — the map is NEVER blank. Slice A owns this; Slice B consumes RouteMap.
 */

/** A [lng, lat] pair — OSRM/GeoJSON coordinate order (NOT lat,lng). */
export type LngLat = [number, number];

/**
 * Minimal GeoJSON LineString shape (dependency-free — we don't pull @types/geojson). This is what
 * OSRM returns for `geometries=geojson` and what we cache on ride.routeGeoJSON. Coordinates are
 * [lng, lat] (GeoJSON order).
 */
export interface LineString {
  type: "LineString";
  coordinates: LngLat[];
}

export interface RouteResult {
  /** GeoJSON LineString geometry (coordinates are [lng, lat]) — feed straight to a polyline. */
  geometry: LineString;
  /** road distance in kilometres */
  distanceKm: number;
  /** estimated duration in minutes */
  durationMin: number;
}

const OSRM_BASE = "https://router.project-osrm.org";
const DEFAULT_TIMEOUT_MS = 4000;

/**
 * Fetch a driving route between two points. Returns null on ANY failure (network, timeout, non-OK,
 * zero routes) so the caller can degrade to a straight line. Never throws.
 */
export async function route(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  opts: { timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<RouteResult | null> {
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = `${OSRM_BASE}/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  // Abort if the caller's own signal fires too.
  if (opts.signal) {
    if (opts.signal.aborted) controller.abort();
    else opts.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      code?: string;
      routes?: Array<{ geometry: LineString; distance: number; duration: number }>;
    };
    const r = data.routes?.[0];
    if (data.code !== "Ok" || !r) return null;
    return {
      geometry: r.geometry,
      distanceKm: Math.round((r.distance / 1000) * 100) / 100,
      durationMin: Math.round(r.duration / 60),
    };
  } catch {
    // timeout / abort / network / parse — degrade gracefully
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Haversine great-circle distance in km — the crow-flies fallback when OSRM is unavailable. */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 100) / 100;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
