"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { usePostLocation } from "@/features/trip/hooks";
import type { TripView } from "@/features/trip/schema";

/**
 * The driver's broadcaster (PRD §7.6 — "the driver's client emits location"). Two ways to feed the
 * live marker:
 *   • Share my location — real device GPS via navigator.geolocation.watchPosition.
 *   • Simulate drive     — walks the vehicle along the route (a static laptop has no moving GPS), so
 *                          the demo shows the passenger's marker + ETA advancing. Both POST to
 *                          /api/trip/[id]/location, which broadcasts on Pusher + updates the poll row.
 */
type LatLng = [number, number];

function distKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Resample a polyline to `n` evenly-spaced points (smooth simulated motion). */
function samplePath(path: LatLng[], n: number): LatLng[] {
  if (path.length <= 1) return path;
  const cum: number[] = [0];
  for (let i = 1; i < path.length; i++) cum.push(cum[i - 1]! + distKm(path[i - 1]!, path[i]!));
  const total = cum[cum.length - 1]!;
  if (total === 0) return [path[0]!];
  const out: LatLng[] = [];
  for (let k = 0; k < n; k++) {
    const target = (total * k) / (n - 1);
    let i = 1;
    while (i < cum.length && cum[i]! < target) i++;
    const t0 = cum[i - 1]!;
    const t1 = cum[i]!;
    const f = t1 === t0 ? 0 : (target - t0) / (t1 - t0);
    const a = path[i - 1]!;
    const b = path[i]!;
    out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
  }
  return out;
}

const SIM_POINTS = 45;
const SIM_INTERVAL_MS = 2000;
const AVG_KM_PER_MIN = 0.5; // ~30 km/h city driving → ETA estimate

export function DriverLocationControls({ trip, route }: { trip: TripView; route: LatLng[] | null }) {
  const post = usePostLocation(trip.id);
  const [gpsOn, setGpsOn] = useState(false);
  const [simOn, setSimOn] = useState(false);
  const watchRef = useRef<number | null>(null);
  const simRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopGps() {
    if (watchRef.current != null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setGpsOn(false);
  }
  function stopSim() {
    if (simRef.current) {
      clearInterval(simRef.current);
      simRef.current = null;
    }
    setSimOn(false);
  }

  useEffect(() => () => {
    stopGps();
    stopSim();
  }, []);

  function toggleGps() {
    if (gpsOn) return stopGps();
    if (!("geolocation" in navigator)) {
      toast({ variant: "destructive", title: "This device has no geolocation" });
      return;
    }
    stopSim();
    watchRef.current = navigator.geolocation.watchPosition(
      (p) => post.mutate({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {
        toast({ variant: "destructive", title: "Location permission denied" });
        stopGps();
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 },
    );
    setGpsOn(true);
  }

  function toggleSim() {
    if (simOn) return stopSim();
    stopGps();
    const base: LatLng[] =
      route && route.length > 1
        ? route
        : [
            [trip.origin.lat, trip.origin.lng],
            [trip.destination.lat, trip.destination.lng],
          ];
    const pts = samplePath(base, SIM_POINTS);
    let i = 0;
    simRef.current = setInterval(() => {
      if (i >= pts.length) {
        const last = pts[pts.length - 1]!;
        post.mutate({ lat: last[0], lng: last[1], etaMin: 0 });
        stopSim();
        return;
      }
      const p = pts[i]!;
      const remainingKm = distKm(p, pts[pts.length - 1]!);
      post.mutate({ lat: p[0], lng: p[1], etaMin: Math.max(0, Math.round(remainingKm / AVG_KM_PER_MIN)) });
      i++;
    }, SIM_INTERVAL_MS);
    setSimOn(true);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant={gpsOn ? "default" : "outline"} size="sm" onClick={toggleGps}>
        {gpsOn ? <Square className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
        {gpsOn ? "Stop sharing" : "Share my location"}
      </Button>
      <Button variant={simOn ? "default" : "outline"} size="sm" onClick={toggleSim}>
        {simOn ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        {simOn ? "Stop simulation" : "Simulate drive"}
      </Button>
    </div>
  );
}
