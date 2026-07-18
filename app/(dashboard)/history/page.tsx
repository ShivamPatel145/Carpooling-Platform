import type { Metadata } from "next";
import { requireRolePage } from "@/lib/session";
import { HistoryList } from "@/features/history/components/history-list";

export const metadata: Metadata = { title: "Ride History" };

export default async function HistoryPage() {
  await requireRolePage("employee");

  return (
    <div>
      <HistoryList />
    </div>
  );
}
