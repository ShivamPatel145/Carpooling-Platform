"use client";

import * as React from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useWalletBalance, useWalletEntries } from "@/features/wallet/hooks";
import type { WalletEntry } from "@/features/wallet/schema";

const inr = (n: number) => n.toLocaleString("en-IN");

function describe(reason: string): { label: string; sub: string } {
  if (reason === "recharge" || reason.startsWith("recharge:")) {
    return { label: "Wallet recharge", sub: "Top-up via UPI" };
  }
  switch (reason) {
    case "ride_payment":
      return { label: "Ride payment", sub: "Seat fare" };
    default:
      return { label: reason.replace(/_/g, " "), sub: "Wallet activity" };
  }
}

/** Live wallet balance card — polls /api/wallet/balance via React Query */
export function LiveBalanceCard({
  orgName,
  userName,
}: {
  orgName: string;
  userName: string;
}) {
  const { data, isLoading } = useWalletBalance();
  const balance = data?.balance ?? 0;

  return (
    <div className="rounded-2xl border border-[color:var(--band-line)] bg-[color:var(--band)] p-6 text-[color:var(--on-band)]">
      <div className="font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-[color:var(--on-band-2)]">
        Wallet balance
      </div>
      <div className="mt-2 font-mono text-[38px] font-semibold leading-none tracking-[-0.02em] text-[color:var(--amber)] transition-all">
        {isLoading ? (
          <span className="inline-block h-10 w-36 animate-pulse rounded-lg bg-[color:var(--on-band-2)] opacity-20" />
        ) : (
          <>₹{inr(balance)}</>
        )}
      </div>
      <div className="mt-3 font-mono text-[12.5px] text-[color:var(--on-band-2)]">
        {orgName} · {userName}
      </div>
    </div>
  );
}

/** Live transaction history — polls /api/wallet via React Query */
export function LiveTransactionHistory() {
  const { data: entries = [], isLoading } = useWalletEntries();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 py-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3.5 py-1">
            <div className="h-9 w-9 shrink-0 rounded-[10px] bg-[color:var(--surface-2)] animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-32 rounded bg-[color:var(--surface-2)] animate-pulse" />
              <div className="h-3 w-24 rounded bg-[color:var(--surface-2)] animate-pulse" />
            </div>
            <div className="h-4 w-16 rounded bg-[color:var(--surface-2)] animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="py-10 text-center text-[13px] text-[color:var(--ink-3)]">
        No transactions yet. Recharge your wallet to get started.
      </p>
    );
  }

  return (
    <ul className="flex flex-col">
      {entries.map((x: WalletEntry, i: number) => {
        const amount = Number(x.delta);
        const credit = amount >= 0;
        const { label, sub } = describe(x.reason);
        const date = new Date(x.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        });
        return (
          <li
            key={x.id}
            className={`flex items-center gap-3.5 py-3.5 ${i > 0 ? "border-t border-[color:var(--line)]" : ""}`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
                credit
                  ? "bg-[color:var(--ok-tint)] text-[color:var(--ok)]"
                  : "bg-[color:var(--surface-2)] text-[color:var(--ink-2)]"
              }`}
            >
              {credit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-semibold text-[color:var(--ink)]">{label}</div>
              <div className="truncate font-mono text-[12px] text-[color:var(--ink-3)]">
                {sub} · {date}
              </div>
            </div>
            <div
              className={`shrink-0 font-mono text-[15px] font-semibold ${
                credit ? "text-[color:var(--ok)]" : "text-[color:var(--ink)]"
              }`}
            >
              {credit ? "+" : "−"}₹{inr(Math.abs(amount))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
