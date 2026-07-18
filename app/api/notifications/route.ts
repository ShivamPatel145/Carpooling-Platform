import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notification } from "@/db/schema";
import { requireAuth } from "@/lib/permissions";
import { withErrorHandler, ok } from "@/lib/api";

const RECENT_LIMIT = 12;

/**
 * GET /api/notifications — the recent feed + total unread count for the topbar bell dropdown.
 * Owner-scoped by userId (the generic notification table has no orgId). `unread` is the TOTAL
 * across all rows (not just the recent slice) so the badge stays accurate past the visible list.
 */
export const GET = withErrorHandler(async () => {
  const session = await requireAuth();
  const userId = session.user.id;

  const [rows, unreadRow] = await Promise.all([
    db
      .select()
      .from(notification)
      .where(eq(notification.userId, userId))
      .orderBy(desc(notification.createdAt))
      .limit(RECENT_LIMIT),
    db
      .select({ n: count() })
      .from(notification)
      .where(and(eq(notification.userId, userId), eq(notification.isRead, false))),
  ]);

  const items = rows.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body ?? null,
    href: n.href ?? null,
    createdAt: new Date(n.createdAt).toISOString(),
    isRead: n.isRead,
  }));

  return ok({ items, unread: unreadRow[0]?.n ?? 0 });
});
