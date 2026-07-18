"use client";

import { StatusBadge } from "@/components/states";
import { coCard, CoAvatar, CoRouteLine, CoSeatBadge, coInitials, splitDepartTime } from "@/components/co/ui";
import type { RideWithMeta } from "@/features/ride/schema";

/**
 * The Coride ride/trip card — a three-band article: driver header, the route line, and the
 * fare/seats footer. `action` slots a Book button (search results) or a Cancel menu (my rides).
 * Fares + times use the mono/tabular face (design-standards §3).
 */
export function RideCard({ ride, action }: { ride: RideWithMeta; action?: React.ReactNode }) {
  const { time, meta } = splitDepartTime(ride.departAt);
  const km = ride.distanceKm ? `${Number(ride.distanceKm).toFixed(0)} km` : undefined;

  return (
    <article className={`${coCard} overflow-hidden`}>
      {/* Driver header */}
      <div className="flex items-center gap-3 px-[18px] pb-[13px] pt-[15px]">
        <CoAvatar initials={coInitials(ride.driverName)} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold text-[color:var(--ink)]">
            {ride.driverName ?? "Driver"}
          </div>
          <div className="truncate font-mono text-[12px] text-[color:var(--ink-3)]">
            {ride.vehicleModel ?? "Vehicle"}
          </div>
        </div>
        <StatusBadge status={ride.status} />
      </div>

      {/* Route line */}
      <div className="flex items-center gap-3.5 border-y border-[color:var(--line)] bg-[color:var(--surface-2)] px-[18px] py-3.5">
        <div className="text-center">
          <div className="font-mono text-[22px] font-semibold leading-none tracking-[-0.01em] text-[color:var(--ink)]">
            {time}
          </div>
          <div className="mt-[3px] text-[11px] text-[color:var(--ink-3)]">{meta}</div>
        </div>
        <CoRouteLine middle={km} />
      </div>

      {/* Fare + seats footer */}
      <div className="flex flex-wrap items-center gap-3.5 px-[18px] py-3.5">
        <CoSeatBadge>
          {ride.seatsAvailable} of {ride.seatsTotal} seats
        </CoSeatBadge>
        <div className="min-w-0 flex-1 truncate text-[12px] text-[color:var(--ink-3)]">
          {ride.origin.label} → {ride.destination.label}
        </div>
        <div className="text-right">
          <div className="font-mono text-[18px] font-semibold text-[color:var(--amber-strong)]">
            ₹{Number(ride.farePerSeat).toFixed(0)}
          </div>
          <div className="text-[11px] text-[color:var(--ink-3)]">per seat</div>
        </div>
        {action}
      </div>
    </article>
  );
}
