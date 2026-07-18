import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { notification } from "@/db/schema";
import { requireAuth } from "@/lib/permissions";
import { withErrorHandler, ok } from "@/lib/api";

/** GET /api/notifications/stats — unread count for the current user (header bell). */
export const GET = withErrorHandler(async () => {
  const session = await requireAuth();
  const [row] = await db
    .select({ n: count() })
    .from(notification)
    .where(and(eq(notification.userId, session.user.id), eq(notification.isRead, false)));
  return ok({ unread: row?.n ?? 0 });
});
