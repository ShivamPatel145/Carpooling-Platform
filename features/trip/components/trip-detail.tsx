"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Car, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, Spinner, StatusBadge } from "@/components/states";
import { formatDateTime } from "@/lib/utils";
import { isLiveStatus, type TripParticipant } from "@/features/trip/schema";
import { useTrip } from "@/features/trip/hooks";
import { TripActions } from "@/features/trip/components/trip-actions";

/** Full trip detail — role-aware (driver sees passengers; passenger sees the driver). Auto-refreshes
 *  ETA/status while live via the polling hook. Renders loading / error / content states. */
export function TripDetail({ id }: { id: string }) {
  const { data: trip, isLoading, isError, refetch } = useTrip(id);

  if (isLoading) return <Spinner label="Loading trip…" />;
  if (isError || !trip) return <ErrorState title="Couldn't load this trip" onRetry={() => refetch()} />;

  const isDriver = trip.role === "driver";
  const live = isLiveStatus(trip.status);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/app/trips">
          <ArrowLeft className="h-4 w-4" />
          All trips
        </Link>
      </Button>

      {/* Route + status + actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="flex flex-wrap items-center gap-x-2 gap-y-1 font-display text-xl font-semibold tracking-tight sm:text-2xl">
            <span>{trip.origin.label}</span>
            <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            <span>{trip.destination.label}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={trip.status} />
            <span className="text-sm text-muted-foreground">
              {isDriver ? "You're driving" : "You're riding"}
            </span>
          </div>
        </div>
        <TripActions trip={trip} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trip</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <dl className="divide-y">
              <Row label="Departs" value={<span className="font-mono text-xs">{formatDateTime(trip.departAt)}</span>} />
              <Row label="Fare / seat" value={<span className="font-mono tabular-nums">₹{trip.farePerSeat}</span>} />
              {trip.seatsBooked != null && (
                <Row label="Your seats" value={<span className="font-mono tabular-nums">{trip.seatsBooked}</span>} />
              )}
              {trip.distanceKm && (
                <Row label="Distance" value={<span className="font-mono tabular-nums">{trip.distanceKm} km</span>} />
              )}
              {live && trip.etaMin != null && (
                <Row label="ETA" value={<span className="font-mono tabular-nums text-accent">{trip.etaMin} min</span>} />
              )}
              <Row label="Vehicle" value={trip.vehicleLabel ?? "—"} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {isDriver ? (
                <>
                  <User className="h-4 w-4" />
                  {trip.passengers.length > 1 ? "Passengers" : "Passenger"}
                </>
              ) : (
                <>
                  <Car className="h-4 w-4" />
                  Driver
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isDriver ? (
              trip.passengers.length ? (
                <div className="divide-y">
                  {trip.passengers.map((p) => (
                    <ParticipantRow key={p.id} p={p} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No passengers on this ride yet.</p>
              )
            ) : (
              <ParticipantRow p={trip.driver} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium">{value}</dd>
    </div>
  );
}

function ParticipantRow({ p }: { p: TripParticipant }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{p.name ?? "Unknown"}</p>
        {p.phone && <p className="font-mono text-xs text-muted-foreground">{p.phone}</p>}
      </div>
      {p.seatsBooked != null && (
        <span className="shrink-0 text-xs text-muted-foreground">
          {p.seatsBooked} seat{p.seatsBooked === 1 ? "" : "s"}
        </span>
      )}
    </div>
  );
}
