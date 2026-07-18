"use client";

import { MapPin, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, ErrorState, StatusBadge, TableSkeleton } from "@/components/states";
import {
  coCard,
  coGhostBtn,
  CoAvatar,
  CoRouteLine,
  CoSeatBadge,
  coInitials,
  splitDepartTime,
} from "@/components/co/ui";
import { RideCard } from "@/features/ride/components/ride-card";
import { useMyRides, useMyBookings, useCancelRide, useCancelBooking } from "@/features/ride/hooks";
import type { RideWithMeta, BookingWithMeta } from "@/features/ride/schema";

/**
 * "My Rides" — the mode-switcher's history. Two tabs: rides I OFFER (driver) and seats I BOOKED
 * (passenger). Each renders loading / empty / error and offers a cancel where valid. Data is
 * owner-scoped by the API. Cards share the Coride ride/trip visual language.
 */
export function MyRidesView() {
  return (
    <Tabs defaultValue="offered">
      <TabsList className="mb-5 max-w-[340px]">
        <TabsTrigger value="offered" className="flex-1">
          Rides I offer
        </TabsTrigger>
        <TabsTrigger value="booked" className="flex-1">
          Seats I booked
        </TabsTrigger>
      </TabsList>
      <TabsContent value="offered">
        <OfferedTab />
      </TabsContent>
      <TabsContent value="booked">
        <BookedTab />
      </TabsContent>
    </Tabs>
  );
}

function CancelButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${coGhostBtn} px-4 py-2.5 text-[14px]`}>
      <X className="h-4 w-4" />
      Cancel
    </button>
  );
}

function OfferedTab() {
  const { data, isLoading, isError, refetch } = useMyRides();
  const cancel = useCancelRide();

  if (isLoading) return <TableSkeleton rows={3} cols={1} />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title="You haven't offered any rides"
        description="Publish your commute and share a seat with colleagues on your route."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {data.map((r) => {
        const cancellable = r.status === "published" || r.status === "full";
        return (
          <RideCard
            key={r.id}
            ride={r as RideWithMeta}
            action={
              cancellable ? (
                <CancelButton onClick={() => cancel.mutate(r.id)} disabled={cancel.isPending} />
              ) : undefined
            }
          />
        );
      })}
    </div>
  );
}

function BookedTab() {
  const { data, isLoading, isError, refetch } = useMyBookings();
  const cancel = useCancelBooking();

  if (isLoading) return <TableSkeleton rows={3} cols={1} />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title="No bookings yet"
        description="Find a ride on your route and book a seat — it'll show up here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {data.map((b) => (
        <BookingCard
          key={b.id}
          booking={b}
          onCancel={
            b.status === "pending" || b.status === "confirmed"
              ? () => cancel.mutate(b.id)
              : undefined
          }
          cancelling={cancel.isPending}
        />
      ))}
    </div>
  );
}

function BookingCard({
  booking: b,
  onCancel,
  cancelling,
}: {
  booking: BookingWithMeta;
  onCancel?: () => void;
  cancelling?: boolean;
}) {
  const { time, meta } = splitDepartTime(b.departAt);
  return (
    <article className={`${coCard} overflow-hidden`}>
      <div className="flex items-center gap-3 px-[18px] pb-[13px] pt-[15px]">
        <CoAvatar initials={coInitials(b.driverName)} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold text-[color:var(--ink)]">
            {b.driverName ?? "Driver"}
          </div>
          <div className="truncate font-mono text-[12px] text-[color:var(--ink-3)]">As passenger</div>
        </div>
        <StatusBadge status={b.status} />
      </div>

      <div className="flex items-center gap-3.5 border-y border-[color:var(--line)] bg-[color:var(--surface-2)] px-[18px] py-3.5">
        <div className="text-center">
          <div className="font-mono text-[22px] font-semibold leading-none tracking-[-0.01em] text-[color:var(--ink)]">
            {time}
          </div>
          <div className="mt-[3px] text-[11px] text-[color:var(--ink-3)]">{meta}</div>
        </div>
        <CoRouteLine
          middle={
            <span className="truncate">
              {b.origin.label} → {b.destination.label}
            </span>
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-3.5 px-[18px] py-3.5">
        <CoSeatBadge>
          {b.seatsBooked} seat{b.seatsBooked === 1 ? "" : "s"}
        </CoSeatBadge>
        <div className="flex-1" />
        <div className="text-right">
          <div className="font-mono text-[18px] font-semibold text-[color:var(--amber-strong)]">
            ₹{Number(b.fareAmount).toFixed(0)}
          </div>
          <div className="text-[11px] text-[color:var(--ink-3)]">total fare</div>
        </div>
        {onCancel && <CancelButton onClick={onCancel} disabled={cancelling} />}
      </div>
    </article>
  );
}
