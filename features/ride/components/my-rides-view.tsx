"use client";

import { ArrowRight, Clock, IndianRupee, MapPin, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState, StatusBadge, TableSkeleton } from "@/components/states";
import { formatDateTime } from "@/lib/utils";
import { RideCard } from "@/features/ride/components/ride-card";
import { useMyRides, useMyBookings, useCancelRide, useCancelBooking } from "@/features/ride/hooks";
import type { RideWithMeta } from "@/features/ride/schema";

/**
 * "My Rides" — the mode-switcher's history. Two tabs: rides I OFFER (driver) and seats I BOOKED
 * (passenger). Each renders loading / empty / error and offers a cancel where valid. All data is
 * owner-scoped by the API.
 */
export function MyRidesView() {
  return (
    <Tabs defaultValue="offered">
      <TabsList>
        <TabsTrigger value="offered">Rides I offer</TabsTrigger>
        <TabsTrigger value="booked">Seats I booked</TabsTrigger>
      </TabsList>
      <TabsContent value="offered" className="mt-4">
        <OfferedTab />
      </TabsContent>
      <TabsContent value="booked" className="mt-4">
        <BookedTab />
      </TabsContent>
    </Tabs>
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
    <div className="space-y-3">
      {data.map((r) => {
        const cancellable = r.status === "published" || r.status === "full";
        return (
          <RideCard
            key={r.id}
            ride={r as RideWithMeta}
            action={
              cancellable ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={cancel.isPending}
                  onClick={() => cancel.mutate(r.id)}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
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
    <div className="space-y-3">
      {data.map((b) => {
        const cancellable = b.status === "pending" || b.status === "confirmed";
        return (
          <Card key={b.id}>
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{b.origin.label}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{b.destination.label}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="font-mono">{formatDateTime(b.departAt)}</span>
                  </span>
                  <span className="font-mono tabular-nums">
                    {b.seatsBooked} seat{b.seatsBooked === 1 ? "" : "s"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <IndianRupee className="h-3.5 w-3.5" />
                    <span className="font-mono tabular-nums">{Number(b.fareAmount).toFixed(0)}</span>
                  </span>
                  {b.driverName && <span>· {b.driverName}</span>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge status={b.status} />
                {cancellable && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={cancel.isPending}
                    onClick={() => cancel.mutate(b.id)}
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
