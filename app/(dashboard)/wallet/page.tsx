import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { requireRolePage } from "@/lib/session";
import { db } from "@/db";
import { organization } from "@/db/schema";
import { coCard } from "@/components/co/ui";
import { WalletRecharge } from "@/features/wallet/components/wallet-recharge";
import { PaymentVerifier } from "@/features/wallet/components/payment-verifier";
import { LiveBalanceCard, LiveTransactionHistory } from "@/features/wallet/components/wallet-live";
import * as React from "react";

export const metadata: Metadata = { title: "Wallet" };

/**
 * Employee wallet page.
 * Balance card and transaction history are client components that poll the
 * /api/wallet/balance and /api/wallet APIs via React Query — they update in
 * real time (every 5 s) without any page reload after a successful payment.
 */
export default async function WalletPage() {
  const session = await requireRolePage("employee");
  const { orgId, name } = session.user;
  const oid = orgId!;

  const orgRow = await db
    .select({ name: organization.name })
    .from(organization)
    .where(eq(organization.id, oid))
    .limit(1);

  const orgName = orgRow[0]?.name ?? "Your organization";

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_1fr]">
        {/* Balance + recharge */}
        <div className="flex flex-col gap-4">
          <React.Suspense fallback={null}>
            <PaymentVerifier />
          </React.Suspense>

          {/* Live balance — updates via React Query polling, no reload needed */}
          <LiveBalanceCard orgName={orgName} userName={name ?? "You"} />

          <div className={`${coCard} p-5`}>
            <WalletRecharge />
          </div>
        </div>

        {/* Live transaction history — updates via React Query polling */}
        <div className={`${coCard} p-5`}>
          <div className="mb-4 font-display text-[15px] font-semibold text-[color:var(--ink)]">
            Transaction history
          </div>
          <LiveTransactionHistory />
        </div>
      </div>
    </div>
  );
}
