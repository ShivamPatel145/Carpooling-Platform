import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSuperAdminPage } from "@/lib/session";
import { ActivityView } from "@/features/activity-log/components/activity-view";

export const metadata: Metadata = { title: "Activity Log" };

/**
 * /platform/activity — the super-admin's CROSS-TENANT audit trail (the "Activity Log" card on the
 * Platform Console links here). Same ActivityView + /api/activity-log as the company-admin screen;
 * the difference is scope: requireSuperAdminPage gates the page, and scopedWhere returns no org
 * filter for a super_admin, so the API streams every org's actions (the one audited exception).
 */
export default async function PlatformActivityPage() {
  await requireSuperAdminPage();
  return (
    <div>
      <Link
        href="/platform"
        className="-ml-1 mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[color:var(--ink-2)] transition hover:text-[color:var(--ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Platform Console
      </Link>
      <div className="mb-6">
        <h2 className="m-0 font-display text-[clamp(22px,3vw,28px)] font-bold tracking-[-0.02em] text-[color:var(--ink)]">
          Activity Log
        </h2>
        <p className="m-0 mt-1 text-[15px] text-[color:var(--ink-2)]">
          Every action across every organisation on Coride, most recent first.
        </p>
      </div>
      <ActivityView />
    </div>
  );
}
