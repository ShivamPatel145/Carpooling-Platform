"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Radio, Wifi } from "lucide-react";
import { ErrorState, Spinner, StatusBadge } from "@/components/states";
import { coCard, CoAvatar, coInitials } from "@/components/co/ui";
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
      <Link
        href={`/app/trips/${id}`}
        className="-ml-1 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[color:var(--ink-2)] transition hover:text-[color:var(--ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Trip details
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="m-0 font-display text-[22px] font-bold tracking-[-0.02em] text-[color:var(--ink)]">
            Live tracking
          </h1>
          <p className="m-0 mt-0.5 font-mono text-[13px] text-[color:var(--ink-3)]">
            {trip.origin.label} → {trip.destination.label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={trip.status} />
          {live && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--amber-line)] bg-[color:var(--amber-tint)] px-2.5 py-1 text-[12px] font-semibold text-[color:var(--amber-strong)]">
              {features.realtime && socketLive ? (
                <>
                  <Radio className="h-3 w-3" /> Live · en route
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
        <div className={`${coCard} flex flex-col items-center gap-3 py-12 text-center`}>
          <p className="m-0 text-[14px] text-[color:var(--ink-2)]">
            Live tracking is active only while a trip is under way.
          </p>
          <StatusBadge status={trip.status} />
        </div>
      ) : (
        <>
          <div className={`${coCard} overflow-hidden`}>
            <TrackingMap origin={trip.origin} destination={trip.destination} driver={driver} route={route} />
          </div>

          {/* Arriving-in + driver card (comp) */}
          <div className={`${coCard} flex flex-wrap items-center gap-4 p-5`}>
            <div className="min-w-[130px]">
              <div className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--ink-3)]">
                Arriving in
              </div>
              {etaMin != null ? (
                <div className="mt-0.5 flex items-baseline gap-1.5">
                  <span className="font-mono text-[32px] font-semibold leading-none text-[color:var(--amber-strong)]">
                    {etaMin}
                  </span>
                  <span className="text-[13px] text-[color:var(--ink-3)]">min to pickup</span>
                </div>
              ) : (
                <div className="mt-1 text-[13px] text-[color:var(--ink-3)]">Waiting for the driver&apos;s location…</div>
              )}
            </div>

            <div className="hidden h-10 w-px bg-[color:var(--line)] sm:block" />

            <div className="flex min-w-[180px] flex-1 items-center gap-3">
              <CoAvatar initials={coInitials(trip.driver.name)} />
              <div className="min-w-0">
                <div className="truncate text-[15px] font-semibold text-[color:var(--ink)]">
                  {trip.driver.name ?? "Driver"}
                </div>
                {trip.vehicleLabel && (
                  <div className="truncate font-mono text-[12px] text-[color:var(--ink-3)]">{trip.vehicleLabel}</div>
                )}
              </div>
            </div>

            {isDriver && (
              <div className="w-full sm:w-auto">
                <DriverLocationControls trip={trip} route={route} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
