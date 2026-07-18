import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vehicle } from "@/db/schema";
import { vehicleFormSchema } from "@/features/vehicle/schema";
import { requirePermission, scopedWhere, canEdit, canDelete } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { withErrorHandler, ok, noContent } from "@/lib/api";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

/** Fetch a vehicle scoped to the requester's org. Cross-org → returns nothing → caller 404s. */
async function findScoped(tenant: Parameters<typeof scopedWhere>[0], id: string) {
  const [row] = await db.select().from(vehicle).where(scopedWhere(tenant, vehicle, eq(vehicle.id, id)));
  return row;
}

/**
 * GET /api/vehicle/:id — read one, org-scoped. A vehicle from another org is NOT FOUND (404), never
 * 403 — the tenant simply can't see across orgs.
 */
export const GET = withErrorHandler(async (_req: Request, { params }: Ctx) => {
  const { tenant } = await requirePermission("vehicle", "read");
  const { id } = await params;
  const row = await findScoped(tenant, id);
  if (!row) throw new NotFoundError("That vehicle doesn't exist.");
  return ok(row);
});

/**
 * PATCH /api/vehicle/:id — update. Org-scoped fetch first (cross-org → 404), then ownership:
 * company_admin+ OR the owner (canEdit). An employee who isn't the owner is refused HERE at the API,
 * even if the UI hid the button. Employees cannot change approvalStatus (admin-only, Slice D).
 */
export const PATCH = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const { session, tenant } = await requirePermission("vehicle", "update");
  const { id } = await params;

  const existing = await findScoped(tenant, id);
  if (!existing) throw new NotFoundError("That vehicle doesn't exist.");
  if (!canEdit(session.user.role, existing.ownerId, session.user.id)) {
    throw new ForbiddenError("You can only edit your own vehicles.");
  }

  const values = vehicleFormSchema.parse(await req.json());
  const [row] = await db
    .update(vehicle)
    .set({
      model: values.model,
      registrationNo: values.registrationNo,
      seatingCapacity: values.seatingCapacity,
      // approvalStatus intentionally NOT settable here — admins own approval (vehicle:approve).
    })
    .where(eq(vehicle.id, id))
    .returning();

  await logActivity({
    orgId: tenant.orgId,
    actorId: session.user.id,
    action: "update",
    resource: "vehicle",
    resourceId: id,
    req,
  });

  return ok(row);
});

/** DELETE /api/vehicle/:id — delete. Org-scoped fetch (cross-org → 404), then canDelete ownership. */
export const DELETE = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const { session, tenant } = await requirePermission("vehicle", "delete");
  const { id } = await params;

  const existing = await findScoped(tenant, id);
  if (!existing) throw new NotFoundError("That vehicle doesn't exist.");
  if (!canDelete(session.user.role, existing.ownerId, session.user.id)) {
    throw new ForbiddenError("You can only delete your own vehicles.");
  }

  await db.delete(vehicle).where(eq(vehicle.id, id));
  await logActivity({
    orgId: tenant.orgId,
    actorId: session.user.id,
    action: "delete",
    resource: "vehicle",
    resourceId: id,
    req,
  });

  return noContent();
});
