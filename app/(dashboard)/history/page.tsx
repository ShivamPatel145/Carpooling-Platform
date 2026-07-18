import type { Metadata } from "next";
import { requireRolePage } from "@/lib/session";
import { HistoryList } from "@/features/history/components/history-list";

export const metadata: Metadata = { title: "Ride History" };

export default async function HistoryPage() {
  await requireRolePage("employee");

  return (
    <div>
      <div className="mb-6">
        <h2 className="m-0 font-display text-[clamp(22px,3vw,28px)] font-bold tracking-[-0.02em] text-[color:var(--ink)]">
          Ride History
        </h2>
        <p className="m-0 mt-1 text-[15px] text-[color:var(--ink-2)]">
          Every completed trip you&apos;ve shared — as a driver and as a rider.
        </p>
      </div>
      <HistoryList />
    </div>
  );
}
