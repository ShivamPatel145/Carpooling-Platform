import { desc } from "drizzle-orm";
import { db } from "@/db";
import { activityLog, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission, scopedWhere } from "@/lib/permissions";
import { withErrorHandler, ok } from "@/lib/api";

/**
 * GET /api/activity-log — the audit trail viewer (Slice C surface, but the read is pure generic
 * infrastructure so it ships in Phase 0). company_admin+ (activityLog:read in the statement).
 * Org-scoped: a company_admin sees only its org's trail; super_admin sees all (scopedWhere returns
 * undefined). Joins the actor's name for display. Capped at the most recent 200 for the client view.
 */
export const GET = withErrorHandler(async () => {
  const { tenant } = await requirePermission("activityLog", "read");

  const rows = await db
    .select({
      id: activityLog.id,
      action: activityLog.action,
      resource: activityLog.resource,
      resourceId: activityLog.resourceId,
      ip: activityLog.ip,
      createdAt: activityLog.createdAt,
      actorName: user.name,
      actorEmail: user.email,
    })
    .from(activityLog)
    .leftJoin(user, eq(activityLog.actorId, user.id))
    .where(scopedWhere(tenant, activityLog))
    .orderBy(desc(activityLog.createdAt))
    .limit(200);

  return ok(rows);
});
