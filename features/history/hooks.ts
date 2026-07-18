"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import type { Trip } from "@/db/schema/trip";
import type { Ride } from "@/db/schema/ride";
import type { Vehicle } from "@/db/schema/vehicle";
import type { User } from "@/db/schema/user";
import type { Booking } from "@/db/schema/booking";

export interface HistoryEntry {
  trip: Trip;
  ride: Ride;
  vehicle: Vehicle | null;
  driver: User;
  booking: Booking | null;
  role: "driver" | "passenger";
}

const KEY = ["history"] as const;

export function useRideHistory() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<HistoryEntry[]>("/api/history"),
  });
}
