"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Radio, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState, Spinner, StatusBadge } from "@/components/states";
import { features } from "@/lib/client-features";
import { getPusherClient } from "@/lib/pusher/client";
import { PUSHER_EVENTS, tripChannel } from "@/lib/pusher/channels";
import { isLiveStatus, type TripLocationPing } from "@/features/trip/schema";
import { useTrip } from "@/features/trip/hooks";
import { DriverLocationControls } from "@/features/trip/components/driver-location-controls";

type LatLng = [number, number];

const TrackingMap = dynamic(
  () => import("@/features/trip/components/tracking-map").then((m) => m.TrackingMap),
  {
    ssr: false,
    loading: () => <div className="h-[58vh] min-h-[340px] w-full animate-pulse rounded-lg border bg-muted" />,
  },
);

/**
 * Live tracking (PRD §7.6, the headline realtime feature). Two update paths run together: an instant
 * Pusher subscription (when configured) AND the useTrip 4s poll (the hour-6 fallback). Whichever
 * arrives first moves the marker, so tracking is robust even if the socket drops. Active only while
 * the trip is live (started/in_progress); the driver also gets the broadcast controls.
 */
export function TrackView({ id }: { id: string }) {
  const { data: trip, isLoading, isError, refetch } = useTrip(id);
  const [pushed, setPushed] = useState<TripLocationPing | null>(null);
  const [route, setRoute] = useState<LatLng[] | null>(null);
  const [socketLive, setSocketLive] = useState(false);

  const hasTrip = Boolean(trip);

  // Instant updates over Pusher; the poll is the fallback.
  useEffect(() => {
    if (!hasTrip || !features.realtime) return;
    const client = getPusherClient();
    if (!client) return;
    const channelName = tripChannel(id);
    const ch = client.subscribe(channelName);
    const onLoc = (data: TripLocationPing) => setPushed(data);
    const onOk = () => setSocketLive(true);
    ch.bind(PUSHER_EVENTS.location, onLoc);
    ch.bind("pusher:subscription_succeeded", onOk);
    return () => {
      ch.unbind(PUSHER_EVENTS.location, onLoc);
      ch.unbind("pusher:subscription_succeeded", onOk);
      client.unsubscribe(channelName);
      setSocketLive(false);
    };
  }, [id, hasTrip]);

  // OSRM road geometry for the route polyline (falls back to a straight line inside the map).
  const oLat = trip?.origin.lat;
  const oLng = trip?.origin.lng;
  const dLat = trip?.destination.lat;
  const dLng = trip?.destination.lng;
  useEffect(() => {
    if (oLat == null || oLng == null || dLat == null || dLng == null) return;
    const url = `https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson`;
    let cancelled = false;
    fetch(url)
      .then((r) => r.json())
      .then((j) => {
        const coords = j?.routes?.[0]?.geometry?.coordinates;
        if (!cancelled && Array.isArray(coords)) {
          setRoute(coords.map((c: number[]) => [c[1]!, c[0]!] as LatLng));
        }
      })
      .catch(() => {
        /* offline / OSRM down → straight-line fallback */
      });
    return () => {
      cancelled = true;
    };
  }, [oLat, oLng, dLat, dLng]);

  if (isLoading) return <Spinner label="Loading tracking…" />;
  if (isError || !trip) return <ErrorState title="Couldn't load tracking" onRetry={() => refetch()} />;

  const isDriver = trip.role === "driver";
  const live = isLiveStatus(trip.status);
  const driver: LatLng | null =
    pushed && typeof pushed.lat === "number"
      ? [pushed.lat, pushed.lng]
      : trip.driverLat && trip.driverLng
        ? [Number(trip.driverLat), Number(trip.driverLng)]
        : null;
  const etaMin = pushed?.etaMin ?? trip.etaMin ?? null;

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={`/app/trips/${id}`}>
          <ArrowLeft className="h-4 w-4" />
          Trip details
        </Link>
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight">Live tracking</h1>
          <p className="text-sm text-muted-foreground">
            {trip.origin.label} → {trip.destination.label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={trip.status} />
          {live && (
            <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
              {features.realtime && socketLive ? (
                <>
                  <Radio className="h-3 w-3 text-accent" /> Live
                </>
              ) : (
                <>
                  <Wifi className="h-3 w-3" /> Polling
                </>
              )}
            </span>
          )}
        </div>
      </div>

      {!live ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Live tracking is active only while a trip is under way.
            </p>
            <StatusBadge status={trip.status} />
          </CardContent>
        </Card>
      ) : (
        <>
          <TrackingMap origin={trip.origin} destination={trip.destination} driver={driver} route={route} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              {etaMin != null ? (
                <>
                  ETA <span className="font-mono tabular-nums text-accent">{etaMin} min</span>
                </>
              ) : (
                <span className="text-muted-foreground">Waiting for the driver's location…</span>
              )}
            </div>
            {isDriver && <DriverLocationControls trip={trip} route={route} />}
          </div>
        </>
      )}
    </div>
  );
}
