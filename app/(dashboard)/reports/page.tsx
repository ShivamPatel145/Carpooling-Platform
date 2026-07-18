import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { requirePermissionPage } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Reports" };

/** Stub — Slice D builds analytics + PDF export build-day. The PDF pipeline already works
 *  (see lib/pdf/render.ts); charts wait on domain data. */
export default async function ReportsPage() {
  await requirePermissionPage("report", "read");
  return (
    <div>
      <PageHeader title="Reports" description="Analytics and exportable reports." />
      <ComingSoon
        icon={BarChart3}
        slice="Slice D"
        builtOn="the working @react-pdf pipeline and recharts (use /dataviz for a colorblind-safe palette)"
      />
    </div>
  );
}
