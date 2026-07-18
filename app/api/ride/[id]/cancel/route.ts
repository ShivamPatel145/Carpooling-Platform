import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { ride, booking } from "@/db/schema";
import { requirePermission, scopedWhere, canEdit } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { withErrorHandler, ok } from "@/lib/api";
import { ForbiddenError, NotFoundError, ConflictError } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/ride/:id/cancel — the driver cancels their ride. Org-scoped fetch (cross-org → 404),
 * ownership via canEdit, then flips status to "cancelled" and cancels every active booking so
 * passengers are released. No transaction (neon-http) — the ride flip is the source of truth; the
 * booking sweep is a follow-up and is safe to retry.
 */
export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const { session, tenant } = await requirePermission("ride", "cancel");
  const { id } = await params;

  const [existing] = await db.select().from(ride).where(scopedWhere(tenant, ride, eq(ride.id, id)));
  if (!existing) throw new NotFoundError("That ride doesn't exist.");
  if (!canEdit(session.user.role, existing.driverId, session.user.id)) {
    throw new ForbiddenError("You can only cancel your own rides.");
  }
  if (existing.status === "cancelled" || existing.status === "completed") {
    throw new ConflictError(`This ride is already ${existing.status}.`);
  }

  const [updated] = await db
    .update(ride)
    .set({ status: "cancelled" })
    .where(eq(ride.id, id))
    .returning();

  // Release passengers.
  await db
    .update(booking)
    .set({ status: "cancelled" })
    .where(and(eq(booking.rideId, id), inArray(booking.status, ["pending", "confirmed"])));

  await logActivity({
    orgId: tenant.orgId,
    actorId: session.user.id,
    action: "cancel",
    resource: "ride",
    resourceId: id,
    req,
  });

  return ok(updated);
});
