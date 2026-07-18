import type { Metadata } from "next";
import { requireRolePage } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { HistoryList } from "@/features/history/components/history-list";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Ride History" };

export default async function HistoryPage() {
  await requireRolePage("employee");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ride History"
        description="View your past trips as a driver and passenger."
      />
      <Card>
        <HistoryList />
      </Card>
    </div>
  );
}
