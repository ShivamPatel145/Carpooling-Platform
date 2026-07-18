import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { booking, ride } from "@/db/schema";
import { requirePermission, scopedWhere, canDelete } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { withErrorHandler, ok } from "@/lib/api";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/booking/:id/cancel — the passenger cancels their booking and the seat(s) go back to the
 * ride. Org-scoped fetch (cross-org → 404), ownership via canDelete (passenger or admin). No
 * transaction (neon-http): mark the booking cancelled first (source of truth), then give seats back
 * with a conditional increment that also flips a "full" ride back to "published".
 */
export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const { session, tenant } = await requirePermission("booking", "cancel");
  const { id } = await params;

  const [existing] = await db
    .select()
    .from(booking)
    .where(scopedWhere(tenant, booking, eq(booking.id, id)));
  if (!existing) throw new NotFoundError("That booking doesn't exist.");
  if (!canDelete(session.user.role, existing.passengerId, session.user.id)) {
    throw new ForbiddenError("You can only cancel your own bookings.");
  }
  if (existing.status === "cancelled" || existing.status === "completed") {
    throw new ConflictError(`This booking is already ${existing.status}.`);
  }

  // Mark cancelled only if it's still active — guards a double-cancel race.
  const [cancelled] = await db
    .update(booking)
    .set({ status: "cancelled" })
    .where(and(eq(booking.id, id), eq(booking.status, existing.status)))
    .returning();
  if (!cancelled) throw new ConflictError("That booking was already updated. Refresh and try again.");

  // Return the seats. Only bump a still-live ride (not a cancelled/completed one), and un-fill it.
  await db
    .update(ride)
    .set({
      seatsAvailable: sql`${ride.seatsAvailable} + ${existing.seatsBooked}`,
      status: sql`case when ${ride.status} = 'full' then 'published' else ${ride.status} end`,
    })
    .where(eq(ride.id, existing.rideId));

  await logActivity({
    orgId: tenant.orgId,
    actorId: session.user.id,
    action: "cancel",
    resource: "booking",
    resourceId: id,
    metadata: { rideId: existing.rideId, seatsReleased: existing.seatsBooked },
    req,
  });

  return ok(cancelled);
});
