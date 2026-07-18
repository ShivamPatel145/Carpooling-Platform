import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organization } from "@/db/schema";
import { organizationFormSchema } from "@/db/schema";
import { requireSuperAdmin, requirePermission, scopedWhere } from "@/lib/permissions";
import { withErrorHandler, noContent } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";
import { logActivity } from "@/lib/activity";

/**
 * GET /api/organization/[id] — fetch one org.
 *   super_admin: any org.
 *   company_admin: only own org (scopedWhere enforces).
 *
 * PATCH /api/organization/[id] — update org config (company_admin for own; super_admin any).
 * DELETE /api/organization/[id] — soft-delete (super_admin only).
 */

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrorHandler(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;

  // Try super_admin first; fall back to company_admin read
  let isSuperAdmin = false;
  let tenant;
  try {
    const result = await requireSuperAdmin();
    tenant = result.tenant;
    isSuperAdmin = true;
  } catch {
    const result = await requirePermission("organization", "read");
    tenant = result.tenant;
  }

  if (!isSuperAdmin && tenant?.orgId !== id) {
    throw new NotFoundError("Organization not found.");
  }
  const where = eq(organization.id, id);

  const row = await db.query.organization.findFirst({ where });
  if (!row) throw new NotFoundError("Organization not found.");
  return NextResponse.json({ organization: row });
});

export const PATCH = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;

  let isSuperAdmin = false;
  let session, tenant;
  try {
    const result = await requireSuperAdmin();
    session = result.session;
    tenant = result.tenant;
    isSuperAdmin = true;
  } catch {
    const result = await requirePermission("organization", "update");
    session = result.session;
    tenant = result.tenant;
  }

  if (!isSuperAdmin && tenant?.orgId !== id) {
    throw new NotFoundError("Organization not found.");
  }
  const where = eq(organization.id, id);

  const existing = await db.query.organization.findFirst({ where });
  if (!existing) throw new NotFoundError("Organization not found.");

  const body = organizationFormSchema.partial().parse(await req.json());
  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.allowedEmailDomains !== undefined) updateData.allowedEmailDomains = body.allowedEmailDomains;
  if (body.currency !== undefined) updateData.currency = body.currency;
  if (body.fuelCostPerKm !== undefined) updateData.fuelCostPerKm = String(body.fuelCostPerKm);
  if (body.travelCostPerKm !== undefined) updateData.travelCostPerKm = String(body.travelCostPerKm);
  if (body.maintenanceMonthly !== undefined) updateData.maintenanceMonthly = String(body.maintenanceMonthly);
  if (body.autoApproveDomain !== undefined) updateData.autoApproveDomain = body.autoApproveDomain;
  // Head office lives in the settings jsonb (no dedicated column) — merge, don't clobber other keys.
  if (body.headOffice !== undefined) {
    const prev = (existing.settings ?? {}) as Record<string, unknown>;
    updateData.settings = { ...prev, headOffice: body.headOffice };
  }

  const [updated] = await db
    .update(organization)
    .set(updateData)
    .where(eq(organization.id, id))
    .returning();

  await logActivity({
    actorId: session.user.id,
    action: "update",
    resource: "organization",
    resourceId: id,
    req,
  });

  return NextResponse.json({ organization: updated });
});

export const DELETE = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const { session } = await requireSuperAdmin();

  const existing = await db.query.organization.findFirst({
    where: eq(organization.id, id),
  });
  if (!existing) throw new NotFoundError("Organization not found.");

  await db.delete(organization).where(eq(organization.id, id));

  await logActivity({
    actorId: session.user.id,
    action: "delete",
    resource: "organization",
    resourceId: id,
    req,
  });

  return noContent();
});
