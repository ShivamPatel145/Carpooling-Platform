import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { ride, booking } from "@/db/schema";
import { bookingFormSchema } from "@/features/ride/schema";
import { requirePermission, scopedWhere } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { withErrorHandler, created } from "@/lib/api";
import { ValidationError, ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";

/**
 * POST /api/booking — book seat(s) on a ride.
 *
 * CONCURRENCY (the reviewer talking point): the neon-http driver has NO transactions, so we do NOT
 * read-then-write. We decrement with a SINGLE conditional UPDATE guarded in the WHERE clause:
 *
 *   UPDATE ride SET seats_available = seats_available - n
 *   WHERE id = :id AND status='published' AND seats_available >= n
 *   RETURNING *
 *
 * The database evaluates the guard atomically, so two racing bookings can't both win — the loser's
 * WHERE matches zero rows and `.returning()` comes back empty → 409. Only after a successful
 * decrement do we insert the booking row; if that insert fails we COMPENSATE by re-incrementing the
 * seats (best-effort), so a seat is never lost.
 */
export const POST = withErrorHandler(async (req: Request) => {
  const { session, tenant } = await requirePermission("booking", "create");
  const values = bookingFormSchema.parse(await req.json());

  // Fetch the ride org-scoped (cross-org → 404). Read fare + validate before touching seats.
  const [target] = await db
    .select()
    .from(ride)
    .where(scopedWhere(tenant, ride, eq(ride.id, values.rideId)));
  if (!target) throw new NotFoundError("That ride doesn't exist.");
  if (target.driverId === session.user.id) {
    throw new ForbiddenError("You can't book your own ride.");
  }
  if (target.status !== "published") {
    throw new ConflictError(`This ride is ${target.status} and can't be booked.`);
  }
  if (values.seatsBooked > target.seatsTotal) {
    throw new ValidationError("That's more seats than the ride offers.");
  }

  // ── Atomic conditional decrement ─────────────────────────────────────────────────────────────
  const [decremented] = await db
    .update(ride)
    .set({
      seatsAvailable: sql`${ride.seatsAvailable} - ${values.seatsBooked}`,
      // Flip to "full" in the same statement when this booking takes the last seat(s).
      status: sql`case when ${ride.seatsAvailable} - ${values.seatsBooked} = 0 then 'full' else ${ride.status} end`,
    })
    .where(
      and(
        eq(ride.id, values.rideId),
        eq(ride.status, "published"),
        gte(ride.seatsAvailable, values.seatsBooked),
      ),
    )
    .returning({ seatsAvailable: ride.seatsAvailable });

  if (!decremented) {
    // The guard matched zero rows: another booking took the seats first (or status changed).
    throw new ConflictError("Those seats were just booked. Please pick another ride.");
  }

  // ── Insert the booking; compensate on failure so a seat is never orphaned ─────────────────────
  const fareAmount = (Number(target.farePerSeat) * values.seatsBooked).toFixed(2);
  let bookingId: string;
  try {
    const [row] = await db
      .insert(booking)
      .values({
        orgId: tenant.orgId!,
        rideId: values.rideId,
        passengerId: session.user.id,
        seatsBooked: values.seatsBooked,
        pickupPoint: values.pickupPoint ?? null,
        dropPoint: values.dropPoint ?? null,
        fareAmount,
        status: "confirmed",
      })
      .returning({ id: booking.id });
    bookingId = row!.id;
  } catch (err) {
    // Give the seats back (best-effort) and restore "published" if we'd flipped it to "full".
    await db
      .update(ride)
      .set({
        seatsAvailable: sql`${ride.seatsAvailable} + ${values.seatsBooked}`,
        status: sql`case when ${ride.status} = 'full' then 'published' else ${ride.status} end`,
      })
      .where(eq(ride.id, values.rideId));
    throw err;
  }

  await logActivity({
    orgId: tenant.orgId,
    actorId: session.user.id,
    action: "create",
    resource: "booking",
    resourceId: bookingId,
    metadata: { rideId: values.rideId, seats: values.seatsBooked, fare: fareAmount },
    req,
  });

  return created({ bookingId });
});
