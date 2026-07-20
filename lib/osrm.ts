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

/** A geographic point in {lat, lng} form (as stored on ride/booking GeoPoints). */
type LatLng = { lat: number; lng: number };

/**
 * Nearest approach of a point to a route polyline. Returns the crow-flies distance to the closest
 * point on the line (`distKm`) AND how far along the route that closest point sits (`alongKm`, km
 * from the route start). The `alongKm` lets the caller enforce travel DIRECTION — a passenger's
 * pickup must sit *before* their drop along the driver's route.
 *
 * `coords` are [lng, lat] (GeoJSON order, as OSRM returns and we cache on ride.routeGeoJSON);
 * `segLen`/`cum` are the per-segment and cumulative haversine lengths, precomputed ONCE per route by
 * corridorMatch so the two projections (pickup, drop) share one distance scale and stay comparable.
 *
 * Distances use a local equirectangular projection centred on the point — exact enough at city scale
 * and cheap. The along-route position multiplies the segment's *haversine* length by the projection
 * fraction `t`, so ordering is projection-independent.
 */
function projectOntoRoute(
  point: LatLng,
  coords: LngLat[],
  segLen: number[],
  cum: number[],
): { distKm: number; alongKm: number } {
  const kx = 111.32 * Math.cos(toRad(point.lat)); // km per ° lng at this latitude
  const ky = 110.57; // km per ° lat
  const px = point.lng * kx;
  const py = point.lat * ky;

  let bestDist = Infinity;
  let bestAlong = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const a = coords[i]!;
    const b = coords[i + 1]!;
    const ax = a[0] * kx;
    const ay = a[1] * ky;
    const dx = b[0] * kx - ax;
    const dy = b[1] * ky - ay;
    const lenSq = dx * dx + dy * dy;
    // Clamped projection parameter of the point onto segment AB.
    let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const distKm = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    if (distKm < bestDist) {
      bestDist = distKm;
      bestAlong = cum[i]! + t * segLen[i]!;
    }
  }
  return { distKm: Math.round(bestDist * 100) / 100, alongKm: bestAlong };
}

/**
 * Corridor match — does the driver's `route` pass near BOTH the passenger's pickup and drop, with
 * pickup coming *before* drop along the route? This is what lets a ride surface to a passenger whose
 * stops are INTERMEDIATE points on the route, not just near the driver's start/end. Endpoint matches
 * fall out for free (origin sits at along≈0, destination at along≈routeLength).
 *
 * Returns the two perpendicular distances to the route (km) and whether the direction is right, so
 * the caller can threshold on a radius and rank by total detour. `coords` are [lng, lat].
 */
export function corridorMatch(
  pickup: LatLng,
  drop: LatLng,
  coords: LngLat[],
): { pickupKm: number; dropKm: number; ordered: boolean } {
  const n = coords.length;
  if (n < 2) {
    // Degenerate route (no usable geometry): treat the lone vertex, if any, as the whole corridor.
    const v = coords[0];
    if (!v) return { pickupKm: Infinity, dropKm: Infinity, ordered: false };
    const p = { lat: v[1], lng: v[0] };
    return { pickupKm: haversineKm(pickup, p), dropKm: haversineKm(drop, p), ordered: true };
  }

  // Per-segment + cumulative haversine lengths, computed once so pickup/drop share a distance scale.
  const segLen = new Array<number>(n - 1);
  const cum = new Array<number>(n);
  cum[0] = 0;
  for (let i = 0; i < n - 1; i++) {
    const a = coords[i]!;
    const b = coords[i + 1]!;
    segLen[i] = haversineKm({ lat: a[1], lng: a[0] }, { lat: b[1], lng: b[0] });
    cum[i + 1] = cum[i]! + segLen[i]!;
  }

  const p = projectOntoRoute(pickup, coords, segLen, cum);
  const d = projectOntoRoute(drop, coords, segLen, cum);
  return { pickupKm: p.distKm, dropKm: d.distKm, ordered: p.alongKm <= d.alongKm };
}
