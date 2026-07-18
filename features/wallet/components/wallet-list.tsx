"use client";

import { useWalletEntries } from "@/features/wallet/hooks";
import { walletColumns } from "@/features/wallet/columns";
import { DataTable } from "@/components/data-table";

export function WalletList() {
  const { data, isLoading, isError, refetch } = useWalletEntries();

  return (
    <DataTable
      columns={walletColumns}
      data={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      searchColumn="reason"
      searchPlaceholder="Search by reason..."
      emptyTitle="No transactions yet"
      emptyDescription="Recharge your wallet to get started."
      pageSize={10}
    />
  );
}
