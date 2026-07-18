import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { requirePermissionPage } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Notifications" };

/** Stub — the notification list/read-toggle is wired build-day on the generic notification table. */
export default async function NotificationsPage() {
  await requirePermissionPage("notification", "read");
  return (
    <div>
      <PageHeader title="Notifications" description="Your in-app notifications." />
      <ComingSoon
        icon={Bell}
        slice="Cross-cutting"
        builtOn="the generic notification table and the /api/notifications endpoints"
      />
    </div>
  );
}
