import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { ReportDashboard } from "@/features/report/components/report-dashboard";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  await requirePermissionPage("report", "read");
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Analytics and exportable reports." />
      <ReportDashboard />
    </div>
  );
}
