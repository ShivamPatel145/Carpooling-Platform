"use client";

import Link from "next/link";
import { CreditCard, Flag, Loader2, MapPin, MessageSquare, Phone, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTransitionTrip } from "@/features/trip/hooks";
import { isLiveStatus, type TripView } from "@/features/trip/schema";

/**
 * Role- and status-aware lifecycle actions for a trip (PRD §7.5 — "each state renders the right
 * actions for driver vs passenger"). Driver: Start. Both driver AND passenger: Complete (while the
 * ride is under way), Track (while live), Call, Chat. Passenger: Pay (once payment_pending → Slice C).
 */
export function TripActions({ trip, onOpenChat }: { trip: TripView; onOpenChat?: () => void }) {
  const transition = useTransitionTrip(trip.id);
  const isDriver = trip.role === "driver";
  const live = isLiveStatus(trip.status);
  const phone = trip.counterparty?.phone?.replace(/\s+/g, "");

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isDriver && trip.status === "booked" && (
        <Button onClick={() => transition.mutate("started")} disabled={transition.isPending}>
          {transition.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Start trip
        </Button>
      )}
      {(trip.status === "booked" || trip.status === "started" || trip.status === "in_progress") && (
        <Button onClick={() => transition.mutate("completed")} disabled={transition.isPending}>
          {transition.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
          Complete trip
        </Button>
      )}
      {live && (
        <Button asChild variant={isDriver ? "outline" : "default"}>
          <Link href={`/app/trips/${trip.id}/track`}>
            <MapPin className="h-4 w-4" />
            {isDriver ? "Live tracking" : "Track ride"}
          </Link>
        </Button>
      )}
      {!isDriver && trip.status === "payment_pending" && trip.bookingId && (
        <Button asChild>
          <Link href={`/pay/${trip.bookingId}`}>
            <CreditCard className="h-4 w-4" />
            Pay now
          </Link>
        </Button>
      )}
      {phone && (
        <Button asChild variant="outline">
          <a href={`tel:${phone}`} aria-label={`Call ${trip.counterparty?.name ?? "the other participant"}`}>
            <Phone className="h-4 w-4" />
            Call
          </a>
        </Button>
      )}
      {onOpenChat && (
        <Button variant="outline" onClick={onOpenChat}>
          <MessageSquare className="h-4 w-4" />
          Chat
        </Button>
      )}
    </div>
  );
}
