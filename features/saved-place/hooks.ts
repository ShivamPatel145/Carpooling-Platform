"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import { toast } from "@/hooks/use-toast";
import type { SavedPlace, SavedPlaceFormValues } from "@/features/saved-place/schema";

/** TanStack Query hooks for saved places (generic-crud rule #3). Copied from features/_demo. */
const KEY = ["saved-place"] as const;

export function useSavedPlaces() {
  return useQuery({ queryKey: [...KEY, "list"], queryFn: () => api.get<SavedPlace[]>("/api/saved-place") });
}

export function useCreateSavedPlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: SavedPlaceFormValues) => api.post<SavedPlace>("/api/saved-place", values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: KEY });
      toast({ variant: "success", title: "Place saved", description: `“${row.label}” was added.` });
    },
    onError: (err: Error) =>
      toast({ variant: "destructive", title: "Couldn't save", description: err.message }),
  });
}

export function useUpdateSavedPlace(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: SavedPlaceFormValues) => api.patch<SavedPlace>(`/api/saved-place/${id}`, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: KEY });
      toast({ variant: "success", title: "Saved", description: `“${row.label}” was updated.` });
    },
    onError: (err: Error) =>
      toast({ variant: "destructive", title: "Couldn't save", description: err.message }),
  });
}

export function useDeleteSavedPlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/saved-place/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast({ variant: "success", title: "Removed", description: "The place was deleted." });
    },
    onError: (err: Error) =>
      toast({ variant: "destructive", title: "Couldn't delete", description: err.message }),
  });
}
