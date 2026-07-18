import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { userFormSchema } from "@/db/schema";
import { requirePermission, scopedWhere } from "@/lib/permissions";
import { withErrorHandler, noContent } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";
import { logActivity } from "@/lib/activity";

/**
 * GET /api/user/[id] — fetch one user.
 * PATCH /api/user/[id] — update profile / status / platformAccess.
 * DELETE /api/user/[id] — remove user (company_admin).
 *
 * TENANCY: scopedWhere means a company_admin requesting a userId from another org
 * gets a 404 (not 403) — the cross-org isolation headline test.
 */

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrorHandler(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const { tenant } = await requirePermission("user", "read");

  const row = await db.query.user.findFirst({
    where: scopedWhere(tenant, user, eq(user.id, id)),
  });
  if (!row) throw new NotFoundError("User not found.");

  // Omit passwordHash from response
  const { passwordHash: _, ...safeUser } = row;
  return NextResponse.json({ user: safeUser });
});

export const PATCH = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const { session, tenant } = await requirePermission("user", "update");

  // Verify user is in same org (scopedWhere → 404 if cross-org)
  const existing = await db.query.user.findFirst({
    where: scopedWhere(tenant, user, eq(user.id, id)),
  });
  if (!existing) throw new NotFoundError("User not found.");

  const body = userFormSchema.partial().parse(await req.json());

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.phone !== undefined) updateData.phone = body.phone;
  if (body.role !== undefined) updateData.role = body.role;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.platformAccess !== undefined) updateData.platformAccess = body.platformAccess;
  if (body.department !== undefined) updateData.department = body.department;
  if (body.manager !== undefined) updateData.manager = body.manager;
  if (body.officeLocation !== undefined) updateData.officeLocation = body.officeLocation;

  const [updated] = await db
    .update(user)
    .set(updateData)
    .where(eq(user.id, id))
    .returning();

  await logActivity({
    actorId: session.user.id,
    action: "update",
    resource: "user",
    resourceId: id,
    req,
  });

  const { passwordHash: _, ...safeUser } = updated!;
  return NextResponse.json({ user: safeUser });
});

export const DELETE = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const { session, tenant } = await requirePermission("user", "delete");

  const existing = await db.query.user.findFirst({
    where: scopedWhere(tenant, user, eq(user.id, id)),
  });
  if (!existing) throw new NotFoundError("User not found.");

  await db.delete(user).where(eq(user.id, id));

  await logActivity({
    actorId: session.user.id,
    action: "delete",
    resource: "user",
    resourceId: id,
    req,
  });

  return noContent();
});
