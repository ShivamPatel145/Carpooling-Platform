"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { RouteMapProps } from "./types";

/**
 * RouteMap — the shared map component (Slice A owns; Slice B consumes for live tracking).
 *
 * Leaflet reads `window` at import time, so the real implementation (route-map.impl.tsx) is loaded
 * dynamically with `ssr: false`. Import THIS file everywhere; never import the impl directly.
 *
 *   <RouteMap
 *     origin={{ lat, lng, label }}
 *     destination={{ lat, lng, label }}
 *     routeGeoJSON={ride.routeGeoJSON}   // optional cached geometry
 *     vehiclePosition={live}             // optional — Slice B moves this from Pusher
 *   />
 *
 * Graceful degradation (no route from OSRM → straight line + crow-flies distance) lives in the impl,
 * so the map is never blank.
 */
const RouteMapImpl = dynamic(() => import("./route-map.impl"), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center rounded-lg border bg-muted/30"
      style={{ height: 360, width: "100%" }}
    >
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <MapPin className="h-5 w-5 animate-pulse" />
        <span className="text-xs">Loading map…</span>
      </div>
    </div>
  ),
});

export function RouteMap(props: RouteMapProps) {
  return <RouteMapImpl {...props} />;
}

export type { RouteMapProps, LatLngPoint } from "./types";
