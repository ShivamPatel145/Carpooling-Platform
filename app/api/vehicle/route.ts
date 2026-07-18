import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { vehicle } from "@/db/schema";
import { vehicleFormSchema } from "@/features/vehicle/schema";
import { requirePermission, scopedWhere } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { withErrorHandler, ok, created } from "@/lib/api";

/**
 * GET  /api/vehicle  — list vehicles in the requester's org (tenancy via scopedWhere).
 * POST /api/vehicle  — register a vehicle. Owner is the session user; orgId from the tenant.
 *
 * TENANCY: every query is orgId-scoped through scopedWhere so no vehicle from another org is ever
 * visible. A new vehicle starts "inactive" (default) — an admin approves it (Slice D).
 */
export const GET = withErrorHandler(async () => {
  const { tenant } = await requirePermission("vehicle", "read");
  const rows = await db
    .select()
    .from(vehicle)
    .where(scopedWhere(tenant, vehicle))
    .orderBy(desc(vehicle.createdAt));
  return ok(rows);
});

export const POST = withErrorHandler(async (req: Request) => {
  const { session, tenant } = await requirePermission("vehicle", "create");
  const values = vehicleFormSchema.parse(await req.json());

  const [row] = await db
    .insert(vehicle)
    .values({
      orgId: tenant.orgId!,
      ownerId: session.user.id,
      model: values.model,
      registrationNo: values.registrationNo,
      seatingCapacity: values.seatingCapacity,
      // approvalStatus omitted → DB default "inactive" (awaits admin approval).
    })
    .returning();

  await logActivity({
    orgId: tenant.orgId,
    actorId: session.user.id,
    action: "create",
    resource: "vehicle",
    resourceId: row!.id,
    metadata: { model: row!.model, registrationNo: row!.registrationNo },
    req,
  });

  return created(row);
});
