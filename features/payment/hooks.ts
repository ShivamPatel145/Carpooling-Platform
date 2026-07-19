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

/**
 * Settle a card/UPI payment server-side after Stripe confirms it in the browser. The server
 * re-checks the PaymentIntent with Stripe, then credits the driver + completes the trip — so the
 * flow finishes without waiting on the webhook (which never reaches localhost).
 */
export function useConfirmPayment() {
  return useMutation({
    mutationFn: (paymentId: string) =>
      api.post<{ status: string }>(`/api/payment/${paymentId}/confirm`, {}),
  });
}
