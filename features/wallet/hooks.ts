"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import { toast } from "@/hooks/use-toast";
import type { WalletEntry, RechargeFormValues } from "./schema";

const KEY = ["wallet"] as const;
const entriesKey = () => [...KEY, "entries"] as const;
const balanceKey = () => [...KEY, "balance"] as const;

export function useWalletEntries() {
  return useQuery({
    queryKey: entriesKey(),
    queryFn: () => api.get<WalletEntry[]>("/api/wallet"),
  });
}

export function useWalletBalance() {
  return useQuery({
    queryKey: balanceKey(),
    queryFn: () => api.get<{ balance: number }>("/api/wallet/balance"),
  });
}

export function useRechargeWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: RechargeFormValues) =>
      api.post<{ clientSecret: string }>("/api/wallet/recharge", values),
    onSuccess: () => {
      // We don't invalidate here, we invalidate after Stripe confirmation.
    },
    onError: (err: Error) =>
      toast({ variant: "destructive", title: "Couldn't initiate recharge", description: err.message }),
  });
}

export function useSimulateRecharge() {
  return useMutation({
    mutationFn: async (amount: number) => {
      return api.post<{ success: boolean; balance: number }>("/api/wallet/simulate-payment", { amount });
    },
  });
}
