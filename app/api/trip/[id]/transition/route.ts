import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { booking, ride, trip, user } from "@/db/schema";
import type { TripStatus } from "@/db/schema/trip";
import { requirePermission, scopedWhere, type Tenant } from "@/lib/permissions";
import { withErrorHandler, ok } from "@/lib/api";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { logActivity } from "@/lib/activity";
import { getTripViewById, writeTripEvent } from "@/lib/trip-service";
import { notifyUser } from "@/lib/notify";
import { pusherTrigger } from "@/lib/pusher/server";
import { PUSHER_EVENTS, tripChannel } from "@/lib/pusher/channels";
import { DRIVER_TRANSITIONS, TRIP_TRANSITIONS, tripTransitionSchema } from "@/features/trip/schema";

type Ctx = { params: Promise<{ id: string }> };

/** Notify the other confirmed participants of a lifecycle change (best-effort, in-app + email). */
async function notifyStatusChange(
  tenant: Tenant,
  rideId: string,
  tripId: string,
  actorId: string,
  driverId: string,
  status: "started" | "completed",
): Promise<void> {
  const bks = await db
    .select()
    .from(booking)
    .where(scopedWhere(tenant, booking, and(eq(booking.rideId, rideId), eq(booking.status, "confirmed"))));
  const recipientIds = new Set<string>([driverId, ...bks.map((b) => b.passengerId)]);
  recipientIds.delete(actorId);
  if (!recipientIds.size) return;

  const users = await db.select().from(user).where(inArray(user.id, [...recipientIds]));
  const copy =
    status === "started"
      ? {
          type: "info" as const,
          title: "Your trip has started",
          body: "Your driver is on the way — you can track the ride live now.",
        }
      : {
          type: "success" as const,
          title: "Trip completed",
          body: "Your trip is complete. Payment is now pending.",
        };
  await Promise.all(
    users.map((u) =>
      notifyUser({
        userId: u.id,
        toEmail: u.email,
        recipientName: u.name,
        href: `/app/trips/${tripId}`,
        resource: "trip",
        resourceId: tripId,
        ...copy,
      }),
    ),
  );
}

/**
 * POST /api/trip/:id/transition — advance the lifecycle state machine (PRD §7.5).
 * booked → started → in_progress → completed → payment_pending → payment_completed.
 * Driver-initiated for start/progress/complete; completion auto-advances to payment_pending (the
 * B→C payment seam). Writes a tripEvent per transition and broadcasts a status event.
 */
export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const { session, tenant } = await requirePermission("trip", "update");
  const { id } = await params;
  const { status: target } = tripTransitionSchema.parse(await req.json());
  const userId = session.user.id;

  const [t] = await db.select().from(trip).where(scopedWhere(tenant, trip, eq(trip.id, id)));
  if (!t) throw new NotFoundError("That trip doesn't exist.");
  const [r] = await db.select().from(ride).where(scopedWhere(tenant, ride, eq(ride.id, t.rideId)));
  if (!r) throw new NotFoundError("That trip doesn't exist.");

  const myBookings = await db
    .select()
    .from(booking)
    .where(scopedWhere(tenant, booking, and(eq(booking.rideId, t.rideId), eq(booking.passengerId, userId))));
  const isDriver = r.driverId === userId;
  const isPassenger = myBookings.length > 0;
  if (!isDriver && !isPassenger) throw new NotFoundError("That trip doesn't exist.");

  if (!TRIP_TRANSITIONS[t.status].includes(target)) {
    throw new AppError(`Can't move a trip from “${t.status}” to “${target}”.`, 409, "INVALID_TRANSITION");
  }
  if (DRIVER_TRANSITIONS.includes(target) && !isDriver) {
    throw new ForbiddenError("Only the driver can advance the trip.");
  }

  const now = new Date();
  const patch: Partial<typeof trip.$inferInsert> = { status: target };
  if (target === "started") patch.startedAt = now;
  if (target === "completed") patch.completedAt = now;
  await db.update(trip).set(patch).where(eq(trip.id, id));
  await writeTripEvent(tenant.orgId!, id, target, { by: userId });

  let finalStatus: TripStatus = target;
  if (target === "completed") {
    // Completion hands off to payment (team-ownership: B signals completion → C collects).
    await db.update(trip).set({ status: "payment_pending" }).where(eq(trip.id, id));
    await writeTripEvent(tenant.orgId!, id, "payment_pending", { auto: true });
    finalStatus = "payment_pending";
  }

  await logActivity({
    orgId: tenant.orgId,
    actorId: userId,
    action: `trip:${target}`,
    resource: "trip",
    resourceId: id,
    req,
  });

  if (target === "started" || target === "completed") {
    await notifyStatusChange(tenant, t.rideId, id, userId, r.driverId, target);
  }

  await pusherTrigger(tripChannel(id), PUSHER_EVENTS.status, { status: finalStatus });

  const view = await getTripViewById(tenant, userId, id);
  return ok(view);
});
