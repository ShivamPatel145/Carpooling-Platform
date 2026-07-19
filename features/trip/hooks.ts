"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import { toast } from "@/hooks/use-toast";
import type { TripLocationValues, TripStatus, TripView } from "@/features/trip/schema";

/**
 * TanStack Query hooks for trips (generic-crud rule #3). All mutations invalidate the trip keys on
 * success and surface a success/error toast. `useTrip(id, { live })` polls every 4s while the trip
 * is live — the Pusher-fallback path that keeps the marker + ETA moving even without a socket.
 *
 * Query-key convention: ["trip", ...].
 */
const KEY = ["trip"] as const;
const listKey = () => [...KEY, "list"] as const;
const detailKey = (id: string) => [...KEY, "detail", id] as const;

const STATUS_TOAST: Record<TripStatus, string> = {
  booked: "Trip booked",
  started: "Trip started — you're live",
  in_progress: "Trip in progress",
  completed: "Trip completed",
  payment_pending: "Trip completed — payment pending",
  payment_completed: "Payment complete",
};

export function useMyTrips() {
  return useQuery({ queryKey: listKey(), queryFn: () => api.get<TripView[]>("/api/trip") });
}

export function useTrip(id: string | undefined) {
  return useQuery({
    queryKey: detailKey(id ?? ""),
    queryFn: () => api.get<TripView>(`/api/trip/${id}`),
    enabled: Boolean(id),
    // Polling fallback (the hour-6 decision): while the trip is live, refetch the driver's location
    // + ETA every 4s so the marker/ETA advance even if the Pusher socket isn't connected.
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === "started" || s === "in_progress" ? 4000 : false;
    },
  });
}

/** Advance the lifecycle (driver: start/complete). */
export function useTransitionTrip(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: TripStatus) => api.post<TripView>(`/api/trip/${id}/transition`, { status }),
    onSuccess: (view) => {
      qc.invalidateQueries({ queryKey: KEY });
      toast({ variant: "success", title: STATUS_TOAST[view.status] ?? "Trip updated" });
    },
    onError: (err: Error) =>
      toast({ variant: "destructive", title: "Couldn't update the trip", description: err.message }),
  });
}

/** Explicit booking→trip create from a ride id (idempotent). */
export function useCreateTripFromRide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rideId: string) => api.post<TripView>("/api/trip", { rideId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (err: Error) =>
      toast({ variant: "destructive", title: "Couldn't start the trip", description: err.message }),
  });
}

/** Driver location ping (no toast — high frequency). */
export function usePostLocation(id: string) {
  return useMutation({
    mutationFn: (loc: TripLocationValues) =>
      api.post<{ ok: boolean; status: TripStatus }>(`/api/trip/${id}/location`, loc),
  });
}

/** Passenger pays for a completed trip via wallet or cash. */
export function usePayTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: { bookingId: string; method: "wallet" | "cash" }) =>
      api.post<{ payment: { id: string }; clientSecret?: string }>("/api/payment", values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      toast({ variant: "success", title: "Payment complete!", description: "The driver has been paid." });
    },
    onError: (err: Error) =>
      toast({ variant: "destructive", title: "Payment failed", description: err.message }),
  });
}

