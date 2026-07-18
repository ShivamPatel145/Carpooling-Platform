import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
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
      <PageHeader
        title="Activity Log"
        description="Every mutating action across the app, most recent first."
      />
      <ActivityView />
    </div>
  );
}
