import { desc } from "drizzle-orm";
import { db } from "@/db";
import { demoEntity } from "@/db/schema";
import { demoEntityFormSchema } from "@/features/_demo/schema";
import { requirePermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { withErrorHandler, ok, created } from "@/lib/api";

/**
 * GET  /api/demo-entity   — list (read). Everyone with demoEntity:read.
 * POST /api/demo-entity   — create. Owner is the session user.
 *
 * Reference implementation of the fixed API shape (generic-crud skill). Every handler opens with
 * requirePermission and every mutation closes with logActivity.
 *
 * NOTE: demoEntity predates tenancy (no orgId column) — its queries stay UNSCOPED. A real domain
 * entity copied from this template carries orgId and is filtered via scopedWhere(tenant, table, …).
 */
export const GET = withErrorHandler(async () => {
  await requirePermission("demoEntity", "read");
  const rows = await db.select().from(demoEntity).orderBy(desc(demoEntity.createdAt));
  return ok(rows);
});

export const POST = withErrorHandler(async (req: Request) => {
  const { session, tenant } = await requirePermission("demoEntity", "create");
  const values = demoEntityFormSchema.parse(await req.json());

  const [row] = await db
    .insert(demoEntity)
    .values({
      ownerId: session.user.id,
      name: values.name,
      description: values.description || null,
      status: values.status,
      amount: values.amount,
      dueDate: values.dueDate ?? null,
      isPinned: values.isPinned,
      attachmentUrl: values.attachmentUrl || null,
    })
    .returning();

  await logActivity({
    orgId: tenant.orgId,
    actorId: session.user.id,
    action: "create",
    resource: "demoEntity",
    resourceId: row!.id,
    metadata: { name: row!.name },
    req,
  });

  return created(row);
});
