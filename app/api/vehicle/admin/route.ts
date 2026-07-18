import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vehicle, user } from "@/db/schema";
import { vehicleFormSchema } from "@/db/schema";
import { requirePermission, scopedWhere } from "@/lib/permissions";
import { withErrorHandler, created } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";
import { logActivity } from "@/lib/activity";
import { desc } from "drizzle-orm";

/**
 * GET /api/vehicle/admin — list all vehicles for the admin's org (approval + inactive).
 * POST /api/vehicle/admin — register a vehicle on behalf of an employee.
 *
 * SEAM with Slice A: Slice A owns employee-facing vehicle CRUD. Mitesh owns this admin surface only.
 * scopedWhere scopes both reads + writes to own org — cross-org request → 404.
 */

export const GET = withErrorHandler(async () => {
  const { tenant } = await requirePermission("vehicle", "read");

  const rows = await db
    .select({
      id: vehicle.id,
      model: vehicle.model,
      registrationNo: vehicle.registrationNo,
      seatingCapacity: vehicle.seatingCapacity,
      approvalStatus: vehicle.approvalStatus,
      orgId: vehicle.orgId,
      ownerId: vehicle.ownerId,
      createdAt: vehicle.createdAt,
    })
    .from(vehicle)
    .where(scopedWhere(tenant, vehicle))
    .orderBy(desc(vehicle.createdAt));

  return NextResponse.json({ vehicles: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const { session, tenant } = await requirePermission("vehicle", "create");

  const body = await req.json();
  const data = vehicleFormSchema.parse(body);

  // Verify ownerId is in same org
  const owner = await db.query.user.findFirst({
    where: scopedWhere(tenant, user, eq(user.id, body.ownerId as string)),
  });
  if (!owner) throw new NotFoundError("Employee not found in this organization.");

  const [newVehicle] = await db
    .insert(vehicle)
    .values({
      orgId: tenant.orgId!,
      ownerId: body.ownerId as string,
      registeredByAdminId: session.user.id,
      model: data.model,
      registrationNo: data.registrationNo,
      seatingCapacity: data.seatingCapacity,
      approvalStatus: data.approvalStatus ?? "inactive",
    })
    .returning();

  await logActivity({
    actorId: session.user.id,
    action: "create",
    resource: "vehicle",
    resourceId: newVehicle!.id,
    req,
  });

  return created({ vehicle: newVehicle });
});
