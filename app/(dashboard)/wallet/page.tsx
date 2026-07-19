import type { Metadata } from "next";
import { and, desc, eq } from "drizzle-orm";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { requireRolePage } from "@/lib/session";
import { db } from "@/db";
import { organization, walletEntry } from "@/db/schema";
import { coCard } from "@/components/co/ui";
import { WalletRecharge } from "@/features/wallet/components/wallet-recharge";
import { PaymentVerifier } from "@/features/wallet/components/payment-verifier";
import * as React from "react";

export const metadata: Metadata = { title: "Wallet" };

const inr = (n: number) => n.toLocaleString("en-IN");

/** Humanise a ledger reason into a card label + subtitle. */
function describe(reason: string): { label: string; sub: string } {
  switch (reason) {
    case "recharge":
      return { label: "Wallet recharge", sub: "Top-up via UPI" };
    case "ride_payment":
      return { label: "Ride payment", sub: "Seat fare" };
    default:
      return { label: reason.replace(/_/g, " "), sub: "Wallet activity" };
  }
}

/**
 * Employee wallet (comp: "Wallet balance / Recharge wallet / Transaction history"). Balance is the
 * latest ledger row's running total; the history is the append-only walletEntry ledger, org- and
 * owner-scoped. Every figure is real — no fabricated numbers (design-standards §1).
 */
export default async function WalletPage() {
  const session = await requireRolePage("employee");
  const { id: userId, orgId, name } = session.user;
  const oid = orgId!;

  const [entries, orgRow] = await Promise.all([
    db
      .select()
      .from(walletEntry)
      .where(and(eq(walletEntry.orgId, oid), eq(walletEntry.userId, userId)))
      .orderBy(desc(walletEntry.createdAt)),
    db.select({ name: organization.name }).from(organization).where(eq(organization.id, oid)).limit(1),
  ]);

  const balance = Number(entries[0]?.balanceAfter ?? 0);
  const orgName = orgRow[0]?.name ?? "Your organization";

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_1fr]">
        {/* Balance + recharge */}
        <div className="flex flex-col gap-4">
          <React.Suspense fallback={null}>
            <PaymentVerifier />
          </React.Suspense>

          <div className="rounded-2xl border border-[color:var(--band-line)] bg-[color:var(--band)] p-6 text-[color:var(--on-band)]">
            <div className="font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-[color:var(--on-band-2)]">
              Wallet balance
            </div>
            <div className="mt-2 font-mono text-[38px] font-semibold leading-none tracking-[-0.02em] text-[color:var(--amber)]">
              ₹{inr(balance)}
            </div>
            <div className="mt-3 font-mono text-[12.5px] text-[color:var(--on-band-2)]">
              {orgName} · {name ?? "You"}
            </div>
          </div>

          <div className={`${coCard} p-5`}>
            <WalletRecharge />
          </div>
        </div>

        {/* Transaction history */}
        <div className={`${coCard} p-5`}>
          <div className="mb-4 font-display text-[15px] font-semibold text-[color:var(--ink)]">
            Transaction history
          </div>
          {entries.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-[color:var(--ink-3)]">
              No transactions yet. Recharge your wallet to get started.
            </p>
          ) : (
            <ul className="flex flex-col">
              {entries.map((x, i) => {
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
          )}
        </div>
      </div>
    </div>
  );
}
