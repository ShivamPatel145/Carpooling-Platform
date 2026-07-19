import type { Metadata } from "next";
import Link from "next/link";
import { and, eq, inArray } from "drizzle-orm";
import { MapPin, Radio } from "lucide-react";
import { requirePermissionPage } from "@/lib/session";
import { db } from "@/db";
import { booking, ride, trip, user } from "@/db/schema";
import type { GeoPoint } from "@/db/schema/ride";
import { LIVE_STATUSES, type TripRole, type TripStatus } from "@/features/trip/schema";
import { EmptyState, StatusBadge } from "@/components/states";
import { coCard, coAmberBtn, coGhostBtn } from "@/components/co/ui";

export const metadata: Metadata = { title: "Live Tracking" };

type LiveTrip = {
  tripId: string;
  status: TripStatus;
  etaMin: number | null;
  origin: GeoPoint;
  destination: GeoPoint;
  role: TripRole;
  counterpart: string | null;
};

/**
 * Live Tracking hub (Coride comp sidebar item). Live tracking is per-trip (`/app/trips/[id]/track`),
 * so this landing gathers every trip the user has UNDER WAY — as a rider (booking → trip) or a driver
 * (trip → ride) — and hands them one tap into the map. Org-/owner-scoped, live statuses only; an empty
 * state guides the user when nothing is running. Gated on the same `trip:track` permission as the map.
 */
export default async function LiveTrackingPage() {
  const session = await requirePermissionPage("trip", "track");
  const { id: userId, orgId } = session.user;
  const oid = orgId!;

  const [asPassenger, asDriver] = await Promise.all([
    db
      .select({
        tripId: trip.id,
        status: trip.status,
        etaMin: trip.etaMin,
        origin: ride.origin,
        destination: ride.destination,
        counterpart: user.name,
      })
      .from(booking)
      .innerJoin(trip, eq(trip.rideId, booking.rideId))
      .innerJoin(ride, eq(ride.id, booking.rideId))
      .innerJoin(user, eq(user.id, ride.driverId))
      .where(
        and(
          eq(booking.orgId, oid),
          eq(booking.passengerId, userId),
          eq(booking.status, "confirmed"),
          inArray(trip.status, [...LIVE_STATUSES]),
        ),
      ),
    db
      .select({
        tripId: trip.id,
        status: trip.status,
        etaMin: trip.etaMin,
        origin: ride.origin,
        destination: ride.destination,
      })
      .from(trip)
      .innerJoin(ride, eq(ride.id, trip.rideId))
      .where(
        and(eq(trip.orgId, oid), eq(ride.driverId, userId), inArray(trip.status, [...LIVE_STATUSES])),
      ),
  ]);

  const trips: LiveTrip[] = [
    ...asPassenger.map((t) => ({ ...t, role: "passenger" as const, counterpart: t.counterpart })),
    ...asDriver.map((t) => ({ ...t, role: "driver" as const, counterpart: null })),
  ];

  return (
    <div>
      {trips.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No trips are live right now"
          description="Live tracking opens automatically the moment a trip you're driving or riding begins. Check your upcoming trips or find a ride going your way."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <Link href="/app/trips" className={`${coAmberBtn} px-4 py-2 text-[14px]`}>
                My Trips
              </Link>
              <Link href="/app/find" className={`${coGhostBtn} px-4 py-2 text-[14px]`}>
                Find a Ride
              </Link>
            </div>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {trips.map((t) => (
            <div
              key={t.tripId}
              className={`${coCard} flex flex-col gap-4 border-l-[3px] border-l-[color:var(--amber)] p-5`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--amber-line)] bg-[color:var(--amber-tint)] px-2.5 py-1 text-[12px] font-semibold text-[color:var(--amber-strong)]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[color:var(--amber)]" />
                    <span className="co-pulse absolute inline-flex h-full w-full rounded-full bg-[color:var(--amber)]" />
                  </span>
                  Live · en route
                </span>
                <StatusBadge status={t.status} />
              </div>

              <div className="font-mono text-[15px] text-[color:var(--ink)]">
                {t.origin?.label} <span className="text-[color:var(--ink-3)]">→</span> {t.destination?.label}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-[13px] text-[color:var(--ink-3)]">
                  {t.role === "passenger"
                    ? t.counterpart
                      ? `Driver · ${t.counterpart}`
                      : "You're riding"
                    : "You're driving"}
                  {t.etaMin != null && (
                    <span className="ml-2 font-mono text-[color:var(--ink-2)]">ETA {t.etaMin} min</span>
                  )}
                </div>
                <Link href={`/app/trips/${t.tripId}/track`} className={`${coAmberBtn} px-4 py-2 text-[14px]`}>
                  <Radio className="h-4 w-4" /> Track live
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
