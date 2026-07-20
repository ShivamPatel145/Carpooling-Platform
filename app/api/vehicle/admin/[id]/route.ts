import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vehicle, vehicleApprovalStatusEnum } from "@/db/schema";
import { requirePermission, scopedWhere } from "@/lib/permissions";
import { withErrorHandler } from "@/lib/api";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { logActivity } from "@/lib/activity";

/**
 * PATCH /api/vehicle/admin/[id] — approve or deactivate a vehicle.
 * scopedWhere ensures the vehicle belongs to the admin's org; cross-org → 404.
 */

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withErrorHandler(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const { session, tenant } = await requirePermission("vehicle", "approve");

  const existing = await db.query.vehicle.findFirst({
    where: scopedWhere(tenant, vehicle, eq(vehicle.id, id)),
  });
  if (!existing) throw new NotFoundError("Vehicle not found.");

  const body = (await req.json()) as { approvalStatus?: "approved" | "inactive" | "rejected" };
  if (!body.approvalStatus || !vehicleApprovalStatusEnum.enumValues.includes(body.approvalStatus)) {
    throw new ValidationError("A valid approvalStatus is required.");
  }

  const [updated] = await db
    .update(vehicle)
    .set({ approvalStatus: body.approvalStatus })
    .where(eq(vehicle.id, id))
    .returning();

  await logActivity({
    actorId: session.user.id,
    action: "update",
    resource: "vehicle",
    resourceId: id,
    req,
  });

  return NextResponse.json({ vehicle: updated });
});
