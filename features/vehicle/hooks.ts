"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import { toast } from "@/hooks/use-toast";
import type { Vehicle, VehicleFormValues } from "@/features/vehicle/schema";

/**
 * TanStack Query hooks for vehicle (generic-crud rule #3). Mutations invalidate the list key on
 * success and fire a success toast. Employees manage their OWN vehicles — the API scopes to the org
 * and enforces ownership; the "my" list is what the /app/vehicles screen shows.
 */
const KEY = ["vehicle"] as const;
const listKey = () => [...KEY, "list"] as const;
const myKey = () => [...KEY, "my"] as const;
const approvedKey = () => [...KEY, "approved"] as const;
const detailKey = (id: string) => [...KEY, "detail", id] as const;

/** All vehicles in the org (admin oversight uses this; employees see "my"). */
export function useVehicles() {
  return useQuery({ queryKey: listKey(), queryFn: () => api.get<Vehicle[]>("/api/vehicle") });
}

/** The current user's own vehicles. */
export function useMyVehicles() {
  return useQuery({ queryKey: myKey(), queryFn: () => api.get<Vehicle[]>("/api/vehicle/my") });
}

/** The current user's APPROVED vehicles — the pool the Offer-a-Ride vehicle picker draws from. */
export function useApprovedVehicles() {
  return useQuery({
    queryKey: approvedKey(),
    queryFn: () => api.get<Vehicle[]>("/api/vehicle/my?approved=1"),
  });
}

export function useVehicle(id: string | undefined) {
  return useQuery({
    queryKey: detailKey(id ?? ""),
    queryFn: () => api.get<Vehicle>(`/api/vehicle/${id}`),
    enabled: Boolean(id),
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: KEY });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: VehicleFormValues) => api.post<Vehicle>("/api/vehicle", values),
    onSuccess: (row) => {
      invalidateAll(qc);
      toast({ variant: "success", title: "Vehicle added", description: `${row.model} (${row.registrationNo}) was registered.` });
    },
    onError: (err: Error) =>
      toast({ variant: "destructive", title: "Couldn't add vehicle", description: err.message }),
  });
}

export function useUpdateVehicle(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: VehicleFormValues) => api.patch<Vehicle>(`/api/vehicle/${id}`, values),
    onSuccess: (row) => {
      invalidateAll(qc);
      toast({ variant: "success", title: "Saved", description: `${row.model} was updated.` });
    },
    onError: (err: Error) =>
      toast({ variant: "destructive", title: "Couldn't save", description: err.message }),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/vehicle/${id}`),
    onSuccess: () => {
      invalidateAll(qc);
      toast({ variant: "success", title: "Vehicle removed", description: "The vehicle was deleted." });
    },
    onError: (err: Error) =>
      toast({ variant: "destructive", title: "Couldn't delete", description: err.message }),
  });
}
