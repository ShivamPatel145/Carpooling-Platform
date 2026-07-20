import { desc, eq, and, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { trip, ride, booking, vehicle, user } from "@/db/schema";
import { requirePermission, scopedWhere } from "@/lib/permissions";
import { withErrorHandler, ok } from "@/lib/api";

/**
 * GET /api/history
 * Fetch completed trips where the current user was either the driver or a passenger.
 */
export const GET = withErrorHandler(async () => {
  const { session, tenant } = await requirePermission("trip", "read"); // or ride:read
  const userId = session.user.id;

  // We can do two queries and merge them, or one complex query. Two queries is easier to type with Drizzle.

  const baseDriverCond = scopedWhere(tenant, trip, and(
    eq(ride.driverId, userId),
    or(eq(trip.status, "completed"), eq(trip.status, "payment_pending"), eq(trip.status, "payment_completed"))
  ));

  const asDriver = await db
    .select({
      trip,
      ride,
      vehicle,
      driver: user,
      role: sql<string>`'driver'`,
    })
    .from(trip)
    .innerJoin(ride, eq(trip.rideId, ride.id))
    .leftJoin(vehicle, eq(ride.vehicleId, vehicle.id))
    .innerJoin(user, eq(ride.driverId, user.id))
    .where(baseDriverCond)
    .orderBy(desc(trip.createdAt));

  const basePassengerCond = scopedWhere(tenant, trip, and(
    eq(booking.passengerId, userId),
    or(eq(trip.status, "completed"), eq(trip.status, "payment_pending"), eq(trip.status, "payment_completed"))
  ));

  const asPassenger = await db
    .select({
      trip,
      ride,
      vehicle,
      driver: user, // need driver details
      booking,
      role: sql<string>`'passenger'`,
    })
    .from(trip)
    .innerJoin(ride, eq(trip.rideId, ride.id))
    .innerJoin(booking, eq(booking.rideId, ride.id))
    .leftJoin(vehicle, eq(ride.vehicleId, vehicle.id))
    .innerJoin(user, eq(ride.driverId, user.id))
    .where(basePassengerCond)
    .orderBy(desc(trip.createdAt));

  // The passenger join is trip↔booking on rideId: a passenger with >1 active booking on the same
  // ride (or any future fan-out) repeats the SAME trip row → duplicate React keys downstream. Collapse
  // to one entry per trip so history is one card per completed trip.
  const seenPassengerTrips = new Set<string>();
  const passengerHistory = asPassenger.filter((row) => {
    if (seenPassengerTrips.has(row.trip.id)) return false;
    seenPassengerTrips.add(row.trip.id);
    return true;
  });

  // Merge and sort (newest first)
  const allHistory = [...asDriver.map((d) => ({ ...d, booking: null })), ...passengerHistory];
  allHistory.sort((a, b) => new Date(b.trip.createdAt).getTime() - new Date(a.trip.createdAt).getTime());

  return ok(allHistory);
});
