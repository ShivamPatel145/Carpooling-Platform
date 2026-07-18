"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { notification } from "@/db/schema";
import { requirePermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";

/**
 * Mark a single notification read. Owner-scoped: the update only ever touches rows belonging to the
 * signed-in user (the generic notification table is keyed by userId, not orgId). RBAC gate first.
 */
export async function markNotificationRead(id: string) {
  const { session } = await requirePermission("notification", "update");
  await db
    .update(notification)
    .set({ isRead: true, readAt: new Date() })
    .where(and(eq(notification.id, id), eq(notification.userId, session.user.id)));
  await logActivity({
    orgId: session.user.orgId ?? null,
    actorId: session.user.id,
    action: "notification.read",
    resource: "notification",
    resourceId: id,
  });
  revalidatePath("/notifications");
}

/** Mark every unread notification for the current user read. */
export async function markAllNotificationsRead() {
  const { session } = await requirePermission("notification", "update");
  await db
    .update(notification)
    .set({ isRead: true, readAt: new Date() })
    .where(and(eq(notification.userId, session.user.id), eq(notification.isRead, false)));
  await logActivity({
    orgId: session.user.orgId ?? null,
    actorId: session.user.id,
    action: "notification.read_all",
    resource: "notification",
  });
  revalidatePath("/notifications");
}
