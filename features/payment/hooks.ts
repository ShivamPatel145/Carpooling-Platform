"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import { toast } from "@/hooks/use-toast";
import type { Payment, PaymentFormValues } from "./schema";

const KEY = ["payment"] as const;
const detailKey = (id: string) => [...KEY, "detail", id] as const;

export function usePayment(id: string | undefined) {
  return useQuery({
    queryKey: detailKey(id ?? ""),
    queryFn: () => api.get<Payment>(`/api/payment/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: PaymentFormValues) =>
      api.post<{ payment: Payment; clientSecret?: string }>("/api/payment", values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (err: Error) =>
      toast({ variant: "destructive", title: "Payment failed", description: err.message }),
  });
}
