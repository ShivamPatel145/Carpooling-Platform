import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { booking, ride, user } from "@/db/schema";
import { requirePermission, scopedWhere } from "@/lib/permissions";
import { withErrorHandler, ok } from "@/lib/api";

/**
 * GET /api/booking/my — the caller's own bookings (passenger mode), enriched with the ride's
 * endpoints, departure, driver name, and ride status for the "My Rides" screen. Org-scoped, then
 * narrowed to passengerId.
 */
export const GET = withErrorHandler(async () => {
  const { session, tenant } = await requirePermission("booking", "read");
  const rows = await db
    .select({
      id: booking.id,
      orgId: booking.orgId,
      rideId: booking.rideId,
      passengerId: booking.passengerId,
      seatsBooked: booking.seatsBooked,
      pickupPoint: booking.pickupPoint,
      dropPoint: booking.dropPoint,
      fareAmount: booking.fareAmount,
      status: booking.status,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      origin: ride.origin,
      destination: ride.destination,
      departAt: ride.departAt,
      rideStatus: ride.status,
      driverName: user.name,
    })
    .from(booking)
    .innerJoin(ride, eq(ride.id, booking.rideId))
    .leftJoin(user, eq(user.id, ride.driverId))
    .where(scopedWhere(tenant, booking, eq(booking.passengerId, session.user.id)))
    .orderBy(desc(booking.createdAt));
  return ok(rows);
});
