"use client";

import { ArrowRight, Clock, Users, IndianRupee, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/states";
import { formatDateTime } from "@/lib/utils";
import type { RideWithMeta } from "@/features/ride/schema";

/**
 * A compact ride summary card for search results + lists. Fare and seats use the mono/tabular face
 * (design-standards §3). `action` slots a Book button (results) or a Cancel menu (my rides).
 */
export function RideCard({ ride, action }: { ride: RideWithMeta; action?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{ride.origin.label}</span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{ride.destination.label}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-mono">{formatDateTime(ride.departAt)}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span className="font-mono tabular-nums">{ride.seatsAvailable}</span> of{" "}
              <span className="font-mono tabular-nums">{ride.seatsTotal}</span> seats
            </span>
            <span className="inline-flex items-center gap-1">
              <IndianRupee className="h-3.5 w-3.5" />
              <span className="font-mono tabular-nums">{Number(ride.farePerSeat).toFixed(0)}</span>
              /seat
            </span>
            {ride.driverName && <span>· {ride.driverName}</span>}
            {ride.distanceKm && (
              <span className="font-mono">· {Number(ride.distanceKm).toFixed(0)} km</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={ride.status} />
          {action}
        </div>
      </CardContent>
    </Card>
  );
}
