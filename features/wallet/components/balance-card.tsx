"use client";

import { useWalletBalance } from "@/features/wallet/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function WalletBalanceCard() {
  const { data, isLoading, isError } = useWalletBalance();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : isError ? (
          <div className="text-sm text-destructive">Error loading balance</div>
        ) : (
          <div className="text-2xl font-bold font-mono tabular-nums">
            ₹{data?.balance.toFixed(2)}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Use your wallet for instant ride payments
        </p>
      </CardContent>
    </Card>
  );
}
