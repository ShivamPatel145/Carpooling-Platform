"use client";

import Link from "next/link";
import { Flag, Loader2, MapPin, Play, QrCode } from "lucide-react";
import { StatusBadge } from "@/components/states";
import { coCard, coAmberBtn, coGhostBtn } from "@/components/co/ui";
import { useMyTrips, useTransitionTrip } from "@/features/trip/hooks";
import { isLiveStatus, type TripStatus, type TripView } from "@/features/trip/schema";

/**
 * Active-ride box — the single "what's happening right now" card that sits above My Trips. It picks
 * the caller's most pressing in-flight trip and renders exactly the actions that stage allows, for
 * BOTH roles: the driver Starts, either party Completes the ride, and the passenger Pays once it's
 * done. Terminal (payment_completed) trips drop out, so the card disappears when nothing's active.
 */

/** Lower rank = shown first: a live ride outranks one waiting on payment, which outranks a booked one. */
const RANK: Record<TripStatus, number> = {
  in_progress: 0,
  started: 1,
  payment_pending: 2,
  completed: 3,
  booked: 4,
  payment_completed: 9,
};

/** Statuses from which either party may mark the ride complete (mirrors TRIP_TRANSITIONS). */
const COMPLETABLE: readonly TripStatus[] = ["booked", "started", "in_progress"];

function pickActive(trips: TripView[] | undefined): TripView | null {
  const active = (trips ?? []).filter((t) => RANK[t.status] < 9);
  if (!active.length) return null;
  return [...active].sort((a, b) => RANK[a.status] - RANK[b.status])[0] ?? null;
}

export function ActiveRideCard() {
  const { data } = useMyTrips();
  const active = pickActive(data);
  // Hook order must be stable — call it unconditionally, before any early return.
  const transition = useTransitionTrip(active?.id ?? "");

  if (!active) return null;

  const isDriver = active.role === "driver";
  const live = isLiveStatus(active.status);
  const canComplete = COMPLETABLE.includes(active.status);
  const awaitingPay = active.status === "payment_pending";

  return (
    <section className={`${coCard} border-l-[3px] border-l-[color:var(--amber)] p-5`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        {live ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--amber-line)] bg-[color:var(--amber-tint)] px-2.5 py-1 text-[12px] font-semibold text-[color:var(--amber-strong)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[color:var(--amber)]" />
              <span className="co-pulse absolute inline-flex h-full w-full rounded-full bg-[color:var(--amber)]" />
            </span>
            Live · en route
          </span>
        ) : (
          <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-[color:var(--ink-3)]">
            {awaitingPay ? "Payment due" : "Your active ride"}
          </span>
        )}
        <StatusBadge status={active.status} />
      </div>

      <div className="font-mono text-[15px] text-[color:var(--ink)]">
        {active.origin.label} <span className="text-[color:var(--ink-3)]">→</span> {active.destination.label}
      </div>
      <div className="mt-1 text-[13px] text-[color:var(--ink-3)]">
        {isDriver ? "You're driving" : "You're riding"}
        {active.counterparty?.name && <span> · with {active.counterparty.name}</span>}
        {live && active.etaMin != null && (
          <span className="ml-2 font-mono text-[color:var(--ink-2)]">ETA {active.etaMin} min</span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        {isDriver && active.status === "booked" && (
          <button
            type="button"
            onClick={() => transition.mutate("started")}
            disabled={transition.isPending}
            className={`${coGhostBtn} px-4 py-2 text-[14px] disabled:pointer-events-none disabled:opacity-60`}
          >
            {transition.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Start ride
          </button>
        )}
        {live && (
          <Link href={`/app/trips/${active.id}/track`} className={`${coGhostBtn} px-4 py-2 text-[14px]`}>
            <MapPin className="h-4 w-4" /> Track live
          </Link>
        )}
        {canComplete && (
          <button
            type="button"
            onClick={() => transition.mutate("completed")}
            disabled={transition.isPending}
            className={`${coAmberBtn} px-4 py-2 text-[14px]`}
          >
            {transition.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
            Complete ride
          </button>
        )}
        {awaitingPay && !isDriver && active.bookingId && (
          <Link href={`/pay/${active.bookingId}`} className={`${coAmberBtn} px-4 py-2 text-[14px]`}>
            <QrCode className="h-4 w-4" /> Pay now
          </Link>
        )}
        {awaitingPay && isDriver && (
          <span className="text-[13px] text-[color:var(--ink-3)]">Waiting for your passenger to pay.</span>
        )}
        <Link
          href={`/app/trips/${active.id}`}
          className="ml-auto text-[13px] font-medium text-[color:var(--amber-strong)] hover:underline"
        >
          View details →
        </Link>
      </div>
    </section>
  );
}
