import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/session";
import { ReportDashboard } from "@/features/report/components/report-dashboard";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  await requirePermissionPage("report", "read");
  return (
    <div>
      <div className="mb-6">
        <h2 className="m-0 font-display text-[clamp(22px,3vw,28px)] font-bold tracking-[-0.02em] text-[color:var(--ink)]">
          Reports
        </h2>
        <p className="m-0 mt-1 text-[15px] text-[color:var(--ink-2)]">
          Real cost, distance, and savings from completed trips.
        </p>
      </div>
      <ReportDashboard />
    </div>
  );
}
