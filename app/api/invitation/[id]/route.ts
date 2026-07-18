import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invitation } from "@/db/schema";
import { requirePermission, requireSuperAdmin, scopedWhere } from "@/lib/permissions";
import { withErrorHandler, noContent } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";
import { logActivity } from "@/lib/activity";

/**
 * DELETE /api/invitation/[id] — revoke a pending invite.
 *   super_admin: any org.
 *   company_admin: own org only (scopedWhere → 404 if cross-org).
 */

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;

  let isSuperAdmin = false;
  let session, tenant;
  try {
    const result = await requireSuperAdmin();
    session = result.session;
    tenant = result.tenant;
    isSuperAdmin = true;
  } catch {
    const result = await requirePermission("invitation", "revoke");
    session = result.session;
    tenant = result.tenant;
  }

  const where = isSuperAdmin
    ? eq(invitation.id, id)
    : scopedWhere(tenant, invitation, eq(invitation.id, id));

  const existing = await db.query.invitation.findFirst({ where });
  if (!existing) throw new NotFoundError("Invitation not found.");

  await db
    .update(invitation)
    .set({ status: "expired" })
    .where(eq(invitation.id, id));

  await logActivity({
    actorId: session.user.id,
    action: "delete",
    resource: "invitation",
    resourceId: id,
    req,
  });

  return noContent();
});
