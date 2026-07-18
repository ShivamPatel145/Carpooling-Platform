import type { Metadata } from "next";
import { requireRolePage } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { WalletList } from "@/features/wallet/components/wallet-list";
import { RechargeDialog } from "@/features/wallet/components/recharge-dialog";
import { WalletBalanceCard } from "@/features/wallet/components/balance-card";

export const metadata: Metadata = { title: "My Wallet" };

export default async function WalletPage() {
  await requireRolePage("employee");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wallet"
        description="Manage your wallet balance and payment history."
        action={<RechargeDialog />}
      />
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <WalletBalanceCard />
        </div>
        <div className="md:col-span-2">
          <WalletList />
        </div>
      </div>
    </div>
  );
}
