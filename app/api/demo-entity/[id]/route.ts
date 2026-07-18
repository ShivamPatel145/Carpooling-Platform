import { eq } from "drizzle-orm";
import { db } from "@/db";
import { demoEntity } from "@/db/schema";
import { demoEntityFormSchema } from "@/features/_demo/schema";
import { requirePermission, canEdit, canDelete } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { withErrorHandler, ok, noContent } from "@/lib/api";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/demo-entity/:id — read one. */
export const GET = withErrorHandler(async (_req: Request, { params }: Ctx) => {
  await requirePermission("demoEntity", "read");
  const { id } = await params;
  const row = await db.query.demoEntity.findFirst({ where: eq(demoEntity.id, id) });
  if (!row) throw new NotFoundError("That item doesn't exist.");
  return ok(row);
});

/**
 * PATCH /api/demo-entity/:id — update. Ownership-scoped: company_admin+ OR the owner (canEdit).
 * This is the RBAC negative-test surface: an employee who isn't the owner is refused HERE, at the
 * API, even if the UI hid the edit button.
 */
export const PATCH = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const { session, tenant } = await requirePermission("demoEntity", "update");
  const { id } = await params;

  const existing = await db.query.demoEntity.findFirst({ where: eq(demoEntity.id, id) });
  if (!existing) throw new NotFoundError("That item doesn't exist.");
  if (!canEdit(session.user.role, existing.ownerId, session.user.id)) {
    throw new ForbiddenError("You can only edit your own items.");
  }

  const values = demoEntityFormSchema.parse(await req.json());
  const [row] = await db
    .update(demoEntity)
    .set({
      name: values.name,
      description: values.description || null,
      status: values.status,
      amount: values.amount,
      dueDate: values.dueDate ?? null,
      isPinned: values.isPinned,
      attachmentUrl: values.attachmentUrl || null,
    })
    .where(eq(demoEntity.id, id))
    .returning();

  await logActivity({
    orgId: tenant.orgId,
    actorId: session.user.id,
    action: "update",
    resource: "demoEntity",
    resourceId: id,
    req,
  });

  return ok(row);
});

/** DELETE /api/demo-entity/:id — delete. Ownership-scoped via canDelete. */
export const DELETE = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const { session, tenant } = await requirePermission("demoEntity", "delete");
  const { id } = await params;

  const existing = await db.query.demoEntity.findFirst({ where: eq(demoEntity.id, id) });
  if (!existing) throw new NotFoundError("That item doesn't exist.");
  if (!canDelete(session.user.role, existing.ownerId, session.user.id)) {
    throw new ForbiddenError("You can only delete your own items.");
  }

  await db.delete(demoEntity).where(eq(demoEntity.id, id));
  await logActivity({
    orgId: tenant.orgId,
    actorId: session.user.id,
    action: "delete",
    resource: "demoEntity",
    resourceId: id,
    req,
  });

  return noContent();
});
