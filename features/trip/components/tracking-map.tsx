"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import L from "leaflet";
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { GeoPoint } from "@/features/trip/schema";

/**
 * Leaflet tracking map (PRD §7.6). Reuses OSM tiles + the accent-teal route polyline; the driver is a
 * divIcon dot (no external image assets → no bundler icon breakage). Rendered client-only via
 * next/dynamic (ssr:false) from track-view, since Leaflet needs `window`.
 */
type LatLng = [number, number];

const driverIcon = L.divIcon({
  className: "trip-driver-marker",
  html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:#0f766e;border:3px solid #fff;box-shadow:0 0 0 2px rgba(15,118,110,0.45),0 1px 4px rgba(0,0,0,0.4)"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

/** Fit origin+destination(+driver) into view once, on mount. */
function FitOnce({ points }: { points: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length >= 2) map.fitBounds(L.latLngBounds(points), { padding: [48, 48] });
    else if (points[0]) map.setView(points[0], 13);
    // fit once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

/** Follow the driver marker as it moves. */
function PanTo({ pos }: { pos: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.panTo(pos, { animate: true, duration: 0.8 });
  }, [pos, map]);
  return null;
}

export function TrackingMap({
  origin,
  destination,
  driver,
  route,
}: {
  origin: GeoPoint;
  destination: GeoPoint;
  driver: LatLng | null;
  route: LatLng[] | null;
}) {
  const o: LatLng = [origin.lat, origin.lng];
  const d: LatLng = [destination.lat, destination.lng];
  const line: LatLng[] = route && route.length > 1 ? route : [o, d];
  const fitPts: LatLng[] = driver ? [o, d, driver] : [o, d];

  return (
    <MapContainer center={o} zoom={12} scrollWheelZoom className="h-[58vh] min-h-[340px] w-full rounded-lg border">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={line} pathOptions={{ color: "#0f766e", weight: 4, opacity: 0.65 }} />
      <CircleMarker center={o} radius={8} pathOptions={{ color: "#15803d", fillColor: "#22c55e", fillOpacity: 0.95, weight: 2 }}>
        <Tooltip>{origin.label} · pickup</Tooltip>
      </CircleMarker>
      <CircleMarker center={d} radius={8} pathOptions={{ color: "#b91c1c", fillColor: "#ef4444", fillOpacity: 0.95, weight: 2 }}>
        <Tooltip>{destination.label} · destination</Tooltip>
      </CircleMarker>
      {driver && (
        <Marker position={driver} icon={driverIcon}>
          <Tooltip direction="top" offset={[0, -10]}>
            Driver
          </Tooltip>
        </Marker>
      )}
      <FitOnce points={fitPts} />
      <PanTo pos={driver} />
    </MapContainer>
  );
}
