import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/session";
import { ActivityView } from "@/features/activity-log/components/activity-view";

export const metadata: Metadata = { title: "Activity Log" };

/**
 * Activity log viewer — a REAL, working read-only screen (the read is generic infrastructure, no
 * domain assumptions). Gated to activityLog:read; the API re-enforces the same permission.
 */
export default async function ActivityPage() {
  await requirePermissionPage("activityLog", "read");
  return (
    <div>
      <div className="mb-6">
        <h2 className="m-0 font-display text-[clamp(22px,3vw,28px)] font-bold tracking-[-0.02em] text-[color:var(--ink)]">
          Activity Log
        </h2>
        <p className="m-0 mt-1 text-[15px] text-[color:var(--ink-2)]">
          Every action in your organisation, most recent first.
        </p>
      </div>
      <ActivityView />
    </div>
  );
}
