import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ride, vehicle } from "@/db/schema";
import { requirePermission, scopedWhere } from "@/lib/permissions";
import { withErrorHandler, ok } from "@/lib/api";

/**
 * GET /api/ride/my — the caller's own published rides (driver mode), newest departure first.
 * Enriched with the vehicle model for the list. Org-scoped, then narrowed to driverId.
 */
export const GET = withErrorHandler(async () => {
  const { session, tenant } = await requirePermission("ride", "read");
  const rows = await db
    .select({
      id: ride.id,
      orgId: ride.orgId,
      driverId: ride.driverId,
      vehicleId: ride.vehicleId,
      origin: ride.origin,
      destination: ride.destination,
      departAt: ride.departAt,
      seatsTotal: ride.seatsTotal,
      seatsAvailable: ride.seatsAvailable,
      farePerSeat: ride.farePerSeat,
      routeGeoJSON: ride.routeGeoJSON,
      distanceKm: ride.distanceKm,
      durationMin: ride.durationMin,
      status: ride.status,
      isRecurring: ride.isRecurring,
      recurrenceRule: ride.recurrenceRule,
      createdAt: ride.createdAt,
      updatedAt: ride.updatedAt,
      vehicleModel: vehicle.model,
    })
    .from(ride)
    .leftJoin(vehicle, eq(vehicle.id, ride.vehicleId))
    .where(scopedWhere(tenant, ride, eq(ride.driverId, session.user.id)))
    .orderBy(desc(ride.departAt));
  return ok(rows);
});
