"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import { toast } from "@/hooks/use-toast";
import type { DemoEntity, DemoEntityFormValues } from "@/features/_demo/schema";

/**
 * TanStack Query hooks for demoEntity. THE reference pattern (generic-crud rule #3): all mutations
 * go through here and invalidate the list key on success, so the UI never shows stale data.
 * Success toasts fire here too (the "success" one of the five states).
 *
 * Query-key convention: ["demo-entity", ...] — copy it as ["<entity>", ...] for a real entity.
 */
const KEY = ["demo-entity"] as const;
const listKey = () => [...KEY, "list"] as const;
const myKey = () => [...KEY, "my"] as const;
const detailKey = (id: string) => [...KEY, "detail", id] as const;
const statsKey = () => [...KEY, "stats"] as const;

export interface DemoStats {
  total: number;
  amountSum: number;
  byStatus: { draft: number; active: number; archived: number };
}

export function useDemoEntities() {
  return useQuery({ queryKey: listKey(), queryFn: () => api.get<DemoEntity[]>("/api/demo-entity") });
}

export function useMyDemoEntities() {
  return useQuery({ queryKey: myKey(), queryFn: () => api.get<DemoEntity[]>("/api/demo-entity/my") });
}

export function useDemoEntity(id: string | undefined) {
  return useQuery({
    queryKey: detailKey(id ?? ""),
    queryFn: () => api.get<DemoEntity>(`/api/demo-entity/${id}`),
    enabled: Boolean(id),
  });
}

export function useDemoStats() {
  return useQuery({ queryKey: statsKey(), queryFn: () => api.get<DemoStats>("/api/demo-entity/stats") });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: KEY });
}

export function useCreateDemoEntity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: DemoEntityFormValues) => api.post<DemoEntity>("/api/demo-entity", values),
    onSuccess: (row) => {
      invalidateAll(qc);
      toast({ variant: "success", title: "Created", description: `“${row.name}” was created.` });
    },
    onError: (err: Error) =>
      toast({ variant: "destructive", title: "Couldn't create", description: err.message }),
  });
}

export function useUpdateDemoEntity(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: DemoEntityFormValues) =>
      api.patch<DemoEntity>(`/api/demo-entity/${id}`, values),
    onSuccess: (row) => {
      invalidateAll(qc);
      toast({ variant: "success", title: "Saved", description: `“${row.name}” was updated.` });
    },
    onError: (err: Error) =>
      toast({ variant: "destructive", title: "Couldn't save", description: err.message }),
  });
}

export function useDeleteDemoEntity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/demo-entity/${id}`),
    onSuccess: () => {
      invalidateAll(qc);
      toast({ variant: "success", title: "Deleted", description: "The item was removed." });
    },
    onError: (err: Error) =>
      toast({ variant: "destructive", title: "Couldn't delete", description: err.message }),
  });
}
