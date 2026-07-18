import { count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { demoEntity } from "@/db/schema";
import { requirePermission } from "@/lib/permissions";
import { withErrorHandler, ok } from "@/lib/api";

/**
 * GET /api/demo-entity/stats — aggregate counts for dashboard/analytics widgets. Real numbers
 * only (design-standards §1). Returns totals by status + overall + a sum of amount.
 */
export const GET = withErrorHandler(async () => {
  await requirePermission("demoEntity", "read");

  const [byStatus, totals] = await Promise.all([
    db
      .select({ status: demoEntity.status, n: count() })
      .from(demoEntity)
      .groupBy(demoEntity.status),
    db
      .select({
        total: count(),
        amountSum: sql<number>`coalesce(sum(${demoEntity.amount}), 0)`.mapWith(Number),
      })
      .from(demoEntity),
  ]);

  const statusMap = Object.fromEntries(byStatus.map((r) => [r.status, r.n]));

  return ok({
    total: totals[0]?.total ?? 0,
    amountSum: totals[0]?.amountSum ?? 0,
    byStatus: {
      draft: statusMap.draft ?? 0,
      active: statusMap.active ?? 0,
      archived: statusMap.archived ?? 0,
    },
  });
});
