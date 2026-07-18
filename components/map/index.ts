/**
 * components/map — the shared RouteMap (Leaflet + OSRM). Slice A owns it; Slice B consumes it for
 * live trip tracking (pass `vehiclePosition`). Import { RouteMap } from "@/components/map".
 */
export { RouteMap } from "./RouteMap";
export type { RouteMapProps, LatLngPoint } from "./types";
