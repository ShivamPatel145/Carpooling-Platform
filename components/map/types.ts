import type { LineString } from "@/lib/osrm";

/**
 * RouteMap public prop types — importable WITHOUT pulling Leaflet into the bundle (Slice B can type
 * against these in server components / non-map code). The actual map is client-only (RouteMap.tsx).
 */

/** A map point. `label` shows in the marker popup. */
export interface LatLngPoint {
  lat: number;
  lng: number;
  label?: string;
}

export interface RouteMapProps {
  /** pickup / start of the ride */
  origin: LatLngPoint;
  /** destination / end of the ride */
  destination: LatLngPoint;
  /**
   * Optional LIVE vehicle position — Slice B updates this from Pusher during a trip to move the
   * amber vehicle marker. Omit for a static route preview (Offer/Find).
   */
  vehiclePosition?: LatLngPoint | null;
  /**
   * Optional cached route geometry (GeoJSON LineString, [lng,lat][]) from OSRM, stored on the ride
   * row. When present the map draws it instantly and skips the network. When absent the map fetches
   * OSRM itself, and falls back to a straight line if that fails.
   */
  routeGeoJSON?: LineString | null;
  className?: string;
  /** map height in px (default 360) */
  height?: number;
  /** disable pan/zoom for a static preview (default true = interactive) */
  interactive?: boolean;
}
