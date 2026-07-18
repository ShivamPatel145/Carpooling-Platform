"use client";

import { Download, History as HistoryIcon } from "lucide-react";
import { useRideHistory, type HistoryEntry } from "@/features/history/hooks";
import { EmptyState, ErrorState, StatusBadge, TableSkeleton } from "@/components/states";
import { coCard, CoAvatar, CoRouteLine, coInitials, splitDepartTime } from "@/components/co/ui";

/**
 * Ride History — completed / paid trips as driver AND passenger, Coride card language. Data comes
 * owner-scoped from /api/history; each paid trip offers a PDF receipt download.
 */
export function HistoryList() {
  const { data, isLoading, isError, refetch } = useRideHistory();

  if (isLoading) return <TableSkeleton rows={4} cols={1} />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={HistoryIcon}
        title="No past rides yet"
        description="Your completed, paid trips will appear here — as a driver and as a passenger."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {data.map((h) => (
        <HistoryCard key={h.trip.id} entry={h} />
      ))}
    </div>
  );
}

function HistoryCard({ entry: h }: { entry: HistoryEntry }) {
  const paid = h.trip.status === "payment_completed" || h.trip.status === "completed";
  const when = h.trip.startedAt ?? h.ride.departAt;
  const { time, meta } = splitDepartTime(when);
  const counterpart = h.role === "driver" ? "You drove" : h.driver.name ?? "Driver";
  const fare = Number(h.booking?.fareAmount ?? h.ride.farePerSeat);

  return (
    <article className={`${coCard} overflow-hidden`}>
      <div className="flex items-center gap-3 px-[18px] pb-[13px] pt-[15px]">
        <CoAvatar initials={coInitials(h.role === "driver" ? "You" : h.driver.name)} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold text-[color:var(--ink)]">{counterpart}</div>
          <div className="truncate font-mono text-[12px] text-[color:var(--ink-3)]">
            {h.role === "driver" ? "As driver" : "As passenger"}
            {h.vehicle ? ` · ${h.vehicle.registrationNo}` : ""}
          </div>
        </div>
        <StatusBadge status={h.trip.status} />
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
              {h.ride.origin.label} → {h.ride.destination.label}
            </span>
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-3.5 px-[18px] py-3.5">
        <div>
          <div className="font-mono text-[18px] font-semibold text-[color:var(--amber-strong)]">
            ₹{fare.toFixed(0)}
          </div>
          <div className="text-[11px] text-[color:var(--ink-3)]">{h.role === "driver" ? "seat fare" : "you paid"}</div>
        </div>
        <div className="flex-1" />
        {paid && (
          <a
            href={`/api/report/receipt/${h.trip.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-[10px] border border-[color:var(--line-2)] bg-[color:var(--surface)] px-4 py-2.5 text-[13px] font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--ink)]"
          >
            <Download className="h-4 w-4" />
            Receipt
          </a>
        )}
      </div>
    </article>
  );
}
