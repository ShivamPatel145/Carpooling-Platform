import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { requirePermissionPage } from "@/lib/session";
import { db } from "@/db";
import { notification } from "@/db/schema";
import {
  NotificationsList,
  type NotificationRow,
} from "@/features/notification/components/notifications-list";

export const metadata: Metadata = { title: "Notifications" };

/**
 * Notifications feed. Server-fetches the signed-in user's rows from the generic notification table
 * (owner-scoped by userId — this table has no orgId), newest first, and hands them to the Coride
 * list which owns read/mark-all interaction. Shared by employees and company admins.
 */
export default async function NotificationsPage() {
  const session = await requirePermissionPage("notification", "read");

  const rows = await db
    .select()
    .from(notification)
    .where(eq(notification.userId, session.user.id))
    .orderBy(desc(notification.createdAt))
    .limit(100);

  const initial: NotificationRow[] = rows.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body ?? null,
    href: n.href ?? null,
    createdAt: new Date(n.createdAt).toISOString(),
    isRead: n.isRead,
  }));

  return (
    <div>
      <div className="mb-6">
        <h2 className="m-0 font-display text-[clamp(22px,3vw,28px)] font-bold tracking-[-0.02em] text-[color:var(--ink)]">
          Notifications
        </h2>
        <p className="m-0 mt-1 text-[15px] text-[color:var(--ink-2)]">
          Match, ETA and payment alerts.
        </p>
      </div>

      <NotificationsList initial={initial} />
    </div>
  );
}
