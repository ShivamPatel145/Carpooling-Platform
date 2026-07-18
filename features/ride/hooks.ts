"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import { toast } from "@/hooks/use-toast";
import type {
  Ride,
  OfferRideFormValues,
  FindRideFormValues,
  BookingFormValues,
  RideWithMeta,
  BookingWithMeta,
} from "@/features/ride/schema";

/**
 * TanStack Query hooks for the ride engine. Mutations invalidate the affected list keys and fire a
 * toast (generic-crud rule #3). Search is a mutation (POST body) exposed as a stateful hook so the
 * results screen can render loading/empty/error.
 */
const KEY = ["ride"] as const;
const myRidesKey = () => [...KEY, "mine"] as const;
const myBookingsKey = () => [...KEY, "bookings"] as const;
const detailKey = (id: string) => [...KEY, "detail", id] as const;

/** The current user's published rides (driver mode). */
export function useMyRides() {
  return useQuery({ queryKey: myRidesKey(), queryFn: () => api.get<RideWithMeta[]>("/api/ride/my") });
}

/** The current user's bookings (passenger mode). */
export function useMyBookings() {
  return useQuery({
    queryKey: myBookingsKey(),
    queryFn: () => api.get<BookingWithMeta[]>("/api/booking/my"),
  });
}

export function useRide(id: string | undefined) {
  return useQuery({
    queryKey: detailKey(id ?? ""),
    queryFn: () => api.get<RideWithMeta>(`/api/ride/${id}`),
    enabled: Boolean(id),
  });
}

/** Publish a ride. Route geometry is computed + cached server-side from OSRM. */
export function useOfferRide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: OfferRideFormValues) => api.post<Ride>("/api/ride", values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast({ variant: "success", title: "Ride published", description: "Colleagues on your route can now book a seat." });
    },
    onError: (err: Error) =>
      toast({ variant: "destructive", title: "Couldn't publish", description: err.message }),
  });
}

/** Cancel one of my rides. */
export function useCancelRide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Ride>(`/api/ride/${id}/cancel`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast({ variant: "success", title: "Ride cancelled", description: "Passengers have been released." });
    },
    onError: (err: Error) =>
      toast({ variant: "destructive", title: "Couldn't cancel", description: err.message }),
  });
}

/** Search for rides (Find mode). Returns matches sorted by relevance; server does the matching. */
export function useSearchRides() {
  return useMutation({
    mutationFn: (values: FindRideFormValues) => api.post<RideWithMeta[]>("/api/ride/search", values),
  });
}

/** Book a seat. The server decrements seats atomically; a race surfaces as a clear error. */
export function useBookRide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: BookingFormValues) => api.post<{ bookingId: string }>("/api/booking", values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast({ variant: "success", title: "Seat booked", description: "Your booking is confirmed. See it under My Rides." });
    },
    onError: (err: Error) =>
      toast({ variant: "destructive", title: "Couldn't book", description: err.message }),
  });
}

/** Cancel one of my bookings (releases the seat back to the ride). */
export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<void>(`/api/booking/${id}/cancel`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast({ variant: "success", title: "Booking cancelled", description: "Your seat has been released." });
    },
    onError: (err: Error) =>
      toast({ variant: "destructive", title: "Couldn't cancel", description: err.message }),
  });
}
