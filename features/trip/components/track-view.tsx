"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import { ArrowLeft, MessageSquare, Phone, Radio, Wifi, Loader2 } from "lucide-react";
import { ErrorState, Spinner, StatusBadge } from "@/components/states";
import { coAmberBtn, coCard, coGhostBtn, CoAvatar, CoEyebrow, coInitials, splitDepartTime } from "@/components/co/ui";
import { features } from "@/lib/client-features";
import { formatDateTime, humanize } from "@/lib/utils";
import { getPusherClient } from "@/lib/pusher/client";
import { PUSHER_EVENTS, tripChannel } from "@/lib/pusher/channels";
import { isLiveStatus, type TripLocationPing, type TripStatus, type TripView } from "@/features/trip/schema";
import { useMyTrips, useTrip, usePayTrip } from "@/features/trip/hooks";
import { DriverLocationControls } from "@/features/trip/components/driver-location-controls";
import { TripChat } from "@/features/message/components/trip-chat";

type LatLng = [number, number];

const TrackingMap = dynamic(
  () => import("@/features/trip/components/tracking-map").then((m) => m.TrackingMap),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-[color:var(--surface-2)]" />,
  },
);

/**
 * Live tracking (PRD §7.6, the headline realtime feature) — laid out like a production ride-hailing
 * app: the map owns the right/top of the screen with the status pill floating over it, and a panel
 * column carries the ETA hero, the person you're riding with (call/chat), the pickup→drop rail and
 * the per-trip chat. Two update paths run together: an instant Pusher subscription AND the useTrip
 * 4s poll — whichever arrives first moves the car, so tracking survives a dropped socket.
 */

/** Haversine km between two points. */
function distKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Path length + km remaining past the driver's nearest vertex → live progress that is REAL. */
function routeProgress(route: LatLng[] | null, driver: LatLng | null): { totalKm: number; leftKm: number } | null {
  if (!route || route.length < 2) return null;
  let totalKm = 0;
  const cum: number[] = [0];
  for (let i = 1; i < route.length; i++) {
    totalKm += distKm(route[i - 1]!, route[i]!);
    cum.push(totalKm);
  }
  if (totalKm === 0) return null;
  if (!driver) return { totalKm, leftKm: totalKm };
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < route.length; i++) {
    const dx = route[i]![0] - driver[0];
    const dy = route[i]![1] - driver[1];
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return { totalKm, leftKm: Math.max(0, totalKm - cum[best]!) };
}

function headlineFor(status: TripStatus, isDriver: boolean): string {
  switch (status) {
    case "started":
      return isDriver ? "Heading to pickup" : "Your driver is on the way";
    case "in_progress":
      return "Trip in progress";
    case "booked":
      return "Waiting to start";
    case "payment_pending":
      return "Trip completed — payment pending";
    case "payment_completed":
      return "Trip completed";
    default:
      return humanize(status);
  }
}

const inr = (v: string | number) => `₹${Number(v).toLocaleString("en-IN")}`;

/**
 * The "how many rides / which is current" strip (Uber/Rapido pattern). Lists every ride the user has
 * LIVE right now, marks the one being tracked, and lets them jump between them. Only renders when
 * there is more than one live ride — a single ride needs no switcher.
 */
function LiveRidesStrip({ trips, currentId }: { trips: TripView[]; currentId: string }) {
  if (trips.length <= 1) return null;
  const currentIndex = Math.max(0, trips.findIndex((t) => t.id === currentId));
  return (
    <div className={`${coCard} p-3`}>
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--ink-3)]">
          Live rides
        </span>
        <span className="font-mono text-[12px] text-[color:var(--ink-2)]">
          {currentIndex + 1} of {trips.length}
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {trips.map((t) => {
          const active = t.id === currentId;
          return (
            <Link
              key={t.id}
              href={`/app/trips/${t.id}/track`}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-[190px] flex-col gap-1 rounded-xl border px-3 py-2.5 transition ${
                active
                  ? "border-[color:var(--amber-line)] bg-[color:var(--amber-tint)]"
                  : "border-[color:var(--line)] bg-[color:var(--surface)] hover:border-[color:var(--ink)]"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[color:var(--amber)]" />
                  <span className="co-pulse absolute inline-flex h-full w-full rounded-full bg-[color:var(--amber)]" />
                </span>
                <span className="text-[11px] font-semibold text-[color:var(--amber-strong)]">
                  {active ? "Now tracking" : t.role === "driver" ? "You're driving" : "You're riding"}
                </span>
              </span>
              <span className="truncate font-mono text-[12.5px] text-[color:var(--ink)]">
                {t.origin.label} → {t.destination.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/** The Uber-style vertical pickup → drop rail (ring / dashed line / diamond). */
function RouteRail({ trip }: { trip: TripView }) {
  const depart = splitDepartTime(trip.departAt);
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center pt-[5px]">
        <span className="h-[10px] w-[10px] shrink-0 rounded-full border-2 border-[color:var(--ink-2)]" />
        <span className="my-1 w-px flex-1 border-l border-dashed border-[color:var(--line-2)]" />
        <span className="h-[9px] w-[9px] shrink-0 rotate-45 bg-[color:var(--ink)]" />
      </div>
      <div className="min-w-0 flex-1 space-y-4">
        <div className="min-w-0">
          <CoEyebrow>Pickup · {depart.time} {depart.meta}</CoEyebrow>
          <div className="mt-0.5 truncate text-[14px] font-semibold text-[color:var(--ink)]">{trip.origin.label}</div>
        </div>
        <div className="min-w-0">
          <CoEyebrow>Drop-off</CoEyebrow>
          <div className="mt-0.5 truncate text-[14px] font-semibold text-[color:var(--ink)]">
            {trip.destination.label}
          </div>
        </div>
      </div>
    </div>
  );
}

function PassengerPaymentPanel({ trip }: { trip: TripView }) {
  const pay = usePayTrip();

  async function handlePay(method: "wallet" | "cash") {
    if (!trip.bookingId) return;
    await pay.mutateAsync({ bookingId: trip.bookingId, method });
  }

  return (
    <>
      <CoEyebrow>Payment required</CoEyebrow>
      <div className="mt-2 space-y-1.5 text-[13.5px] text-[color:var(--ink-2)]">
        <div>
          Amount due <span className="font-mono font-semibold text-[color:var(--ink)]">{inr(trip.fareAmount ?? 0)}</span>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => handlePay("wallet")}
          disabled={pay.isPending}
          className={`${coAmberBtn} flex-1 px-4 py-2.5 text-[13.5px]`}
        >
          {pay.isPending && pay.variables?.method === "wallet" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
          ) : null}
          Pay via Wallet
        </button>
        <button
          onClick={() => handlePay("cash")}
          disabled={pay.isPending}
          className={`${coGhostBtn} flex-1 px-4 py-2.5 text-[13.5px] border border-[color:var(--line-2)]`}
        >
          {pay.isPending && pay.variables?.method === "cash" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
          ) : null}
          Pay Cash
        </button>
      </div>
    </>
  );
}

export function TrackView({ id }: { id: string }) {
  const { data: trip, isLoading, isError, refetch } = useTrip(id);
  const { data: allTrips } = useMyTrips();
  const liveTrips = (allTrips ?? []).filter((t) => isLiveStatus(t.status));
  const [pushed, setPushed] = useState<TripLocationPing | null>(null);
  const [route, setRoute] = useState<LatLng[] | null>(null);
  const [socketLive, setSocketLive] = useState(false);
  const { resolvedTheme } = useTheme();
  const reduceMotion = useReducedMotion();

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

  const driver: LatLng | null = useMemo(() => {
    if (pushed && typeof pushed.lat === "number") return [pushed.lat, pushed.lng];
    if (trip?.driverLat && trip?.driverLng) return [Number(trip.driverLat), Number(trip.driverLng)];
    return null;
  }, [pushed, trip?.driverLat, trip?.driverLng]);

  const progress = useMemo(() => routeProgress(route, driver), [route, driver]);

  if (isLoading) return <Spinner label="Loading tracking…" />;
  if (isError || !trip) return <ErrorState title="Couldn't load tracking" onRetry={() => refetch()} />;

  const isDriver = trip.role === "driver";
  const live = isLiveStatus(trip.status);
  const etaMin = pushed?.etaMin ?? trip.etaMin ?? null;
  const other = trip.counterparty;
  const [vehicleModel, vehiclePlate] = (trip.vehicleLabel ?? "").split(" · ");
  const pct = live && progress ? Math.min(1, Math.max(0, 1 - progress.leftKm / progress.totalKm)) : null;
  const depart = splitDepartTime(trip.departAt);
  const fade = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: "easeOut" as const } };

  const livePill = (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--amber-line)] bg-[color:var(--surface)] px-2.5 py-1 text-[12px] font-semibold text-[color:var(--amber-strong)] shadow-sm">
      {features.realtime && socketLive ? (
        <>
          <Radio className="h-3 w-3" /> Live
        </>
      ) : (
        <>
          <Wifi className="h-3 w-3" /> Updating every 4s
        </>
      )}
    </span>
  );

  return (
    <div className="space-y-3">
      {/* Header row — back, headline, status */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={`/app/trips/${id}`}
            aria-label="Back to trip details"
            className={`${coGhostBtn} h-10 w-10 shrink-0 !rounded-full p-0`}
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </Link>
          <div className="min-w-0">
            <h1 className="m-0 truncate font-display text-[21px] font-bold tracking-[-0.02em] text-[color:var(--ink)]">
              {headlineFor(trip.status, isDriver)}
            </h1>
            <p className="m-0 mt-0.5 truncate font-mono text-[12.5px] text-[color:var(--ink-3)]">
              {trip.origin.label} → {trip.destination.label}
            </p>
          </div>
        </div>
        <StatusBadge status={trip.status} />
      </div>

      <LiveRidesStrip trips={liveTrips} currentId={id} />

      <div className="grid gap-3 lg:grid-cols-[400px,minmax(0,1fr)] lg:items-start lg:gap-4">
        {/* ── The map — full-height on desktop, on top on mobile, status pill floating over it ── */}
        <motion.div
          {...fade}
          className="relative isolate order-1 h-[42vh] min-h-[300px] overflow-hidden rounded-2xl border border-[color:var(--line)] lg:sticky lg:top-[76px] lg:order-2 lg:h-[calc(100dvh-190px)] lg:min-h-[480px]"
        >
          <TrackingMap
            origin={trip.origin}
            destination={trip.destination}
            driver={driver}
            route={route}
            dark={resolvedTheme === "dark"}
            etaMin={live ? etaMin : null}
          />
          {live && <div className="absolute left-3 top-3 z-[1000]">{livePill}</div>}
          {live && !driver && (
            <div className="absolute bottom-3 left-1/2 z-[1000] -translate-x-1/2">
              <span className="whitespace-nowrap rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-1.5 text-[12px] font-medium text-[color:var(--ink-2)] shadow-sm">
                Waiting for the driver&apos;s location…
              </span>
            </div>
          )}
        </motion.div>

        {/* ── The panel column ── */}
        <motion.section
          {...fade}
          transition={reduceMotion ? undefined : { duration: 0.35, ease: "easeOut", delay: 0.08 }}
          className="order-2 space-y-3 lg:order-1"
        >
          {/* ETA hero / schedule / completion */}
          <div className={`${coCard} p-5`}>
            {live ? (
              <>
                <CoEyebrow>{trip.status === "in_progress" ? "Reaching drop-off in" : "Arriving at pickup in"}</CoEyebrow>
                {etaMin != null ? (
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="font-mono text-[42px] font-semibold leading-none tracking-[-0.01em] text-[color:var(--ink)]">
                      {etaMin}
                    </span>
                    <span className="text-[14px] font-medium text-[color:var(--ink-2)]">min</span>
                    {progress && (
                      <span className="font-mono text-[13px] text-[color:var(--ink-3)]">
                        · {progress.leftKm.toFixed(1)} km left
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="mt-1.5 text-[13.5px] text-[color:var(--ink-3)]">
                    Waiting for the driver&apos;s location…
                  </div>
                )}
                {pct != null && (
                  <div className="mt-4 h-1 overflow-hidden rounded-full bg-[color:var(--line)]">
                    <div
                      className="h-full rounded-full bg-[color:var(--amber)] transition-[width] duration-1000 ease-linear"
                      style={{ width: `${Math.round(pct * 100)}%` }}
                    />
                  </div>
                )}
              </>
            ) : trip.status === "booked" ? (
              <>
                <CoEyebrow>Scheduled pickup</CoEyebrow>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-[42px] font-semibold leading-none tracking-[-0.01em] text-[color:var(--ink)]">
                    {depart.time}
                  </span>
                  <span className="text-[14px] font-medium text-[color:var(--ink-2)]">{depart.meta}</span>
                </div>
                <p className="m-0 mt-2 text-[13.5px] text-[color:var(--ink-3)]">
                  Tracking goes live when the driver starts the trip.
                </p>
              </>
            ) : trip.status === "payment_pending" && !isDriver ? (
              <PassengerPaymentPanel trip={trip} />
            ) : (
              <>
                <CoEyebrow>Trip summary</CoEyebrow>
                <div className="mt-2 space-y-1.5 text-[13.5px] text-[color:var(--ink-2)]">
                  {trip.completedAt && <div>Completed {formatDateTime(trip.completedAt)}</div>}
                  {trip.fareAmount != null && (
                    <div>
                      Fare <span className="font-mono font-semibold text-[color:var(--ink)]">{inr(trip.fareAmount)}</span>
                    </div>
                  )}
                </div>
                <Link
                  href={`/app/trips/${id}`}
                  className={`${coAmberBtn} mt-4 w-full px-4 py-2.5 text-[13.5px]`}
                >
                  View trip details
                </Link>
              </>
            )}
          </div>

          {/* Who you're riding with — call + chat */}
          {other && (
            <div className={`${coCard} p-4`}>
              <div className="flex items-center gap-3">
                <CoAvatar initials={coInitials(other.name)} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold text-[color:var(--ink)]">
                    {other.name ?? (isDriver ? "Passenger" : "Driver")}
                  </div>
                  <div className="truncate text-[12.5px] text-[color:var(--ink-3)]">
                    {isDriver
                      ? `Passenger${trip.passengers.length > 1 ? ` · +${trip.passengers.length - 1} more` : ""}`
                      : vehicleModel || "Driver"}
                  </div>
                </div>
                {!isDriver && vehiclePlate && (
                  <span className="shrink-0 rounded-md border border-[color:var(--line-2)] bg-[color:var(--surface-2)] px-2.5 py-1.5 font-mono text-[12.5px] font-semibold uppercase tracking-[0.08em] text-[color:var(--ink)]">
                    {vehiclePlate}
                  </span>
                )}
              </div>
              <div className="mt-3.5 flex gap-2">
                {other.phone && (
                  <a href={`tel:${other.phone}`} className={`${coAmberBtn} min-h-[44px] flex-1 px-4 text-[13.5px]`}>
                    <Phone className="h-4 w-4" /> Call
                  </a>
                )}
                <a href="#trip-chat" className={`${coGhostBtn} min-h-[44px] flex-1 px-4 text-[13.5px]`}>
                  <MessageSquare className="h-4 w-4" /> Chat
                </a>
              </div>
            </div>
          )}

          {/* Pickup → drop rail + the real trip numbers */}
          <div className={`${coCard} p-4`}>
            <RouteRail trip={trip} />
            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[color:var(--line)] pt-3.5">
              {trip.fareAmount != null ? (
                <span className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] px-2.5 py-1 font-mono text-[12px] text-[color:var(--ink-2)]">
                  {inr(trip.fareAmount)} fare
                </span>
              ) : (
                <span className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] px-2.5 py-1 font-mono text-[12px] text-[color:var(--ink-2)]">
                  {inr(trip.farePerSeat)} / seat
                </span>
              )}
              {trip.distanceKm && (
                <span className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] px-2.5 py-1 font-mono text-[12px] text-[color:var(--ink-2)]">
                  {Number(trip.distanceKm).toFixed(1)} km
                </span>
              )}
              {trip.durationMin != null && (
                <span className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] px-2.5 py-1 font-mono text-[12px] text-[color:var(--ink-2)]">
                  ~{trip.durationMin} min
                </span>
              )}
              {trip.seatsBooked != null && (
                <span className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] px-2.5 py-1 font-mono text-[12px] text-[color:var(--ink-2)]">
                  {trip.seatsBooked} seat{trip.seatsBooked > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Driver's broadcast controls */}
          {isDriver && live && (
            <div className={`${coCard} p-4`}>
              <CoEyebrow>Broadcast your location</CoEyebrow>
              <p className="m-0 mb-3 mt-1 text-[12.5px] leading-relaxed text-[color:var(--ink-3)]">
                Passengers see your car move in realtime. Use device GPS, or simulate the drive for a
                demo from a desk.
              </p>
              <DriverLocationControls trip={trip} route={route} />
            </div>
          )}

          {/* Per-trip chat — same Pusher channel as tracking */}
          <TripChat tripId={id} title={other?.name ? `Chat with ${other.name}` : "Trip chat"} />
        </motion.section>
      </div>
    </div>
  );
}
