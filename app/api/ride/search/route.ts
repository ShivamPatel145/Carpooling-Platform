import { and, eq, gte, lte, ne, desc } from "drizzle-orm";
import { db } from "@/db";
import { ride, user, vehicle } from "@/db/schema";
import { findRideFormSchema, type RideWithMeta } from "@/features/ride/schema";
import { requirePermission, scopedWhere } from "@/lib/permissions";
import { withErrorHandler, ok } from "@/lib/api";
import { corridorMatch, type LineString, type LngLat } from "@/lib/osrm";
import type { GeoPoint } from "@/db/schema/ride";

/**
 * POST /api/ride/search — Find-a-ride matching. Server-side so the ranking (proximity) is trusted.
 *
 * Filters (SQL): same org (scopedWhere), status=published, departs within the requested day,
 * seatsAvailable ≥ requested, driver ≠ requester (you can't book your own ride).
 * Match + rank (JS, since geometry is jsonb): a CORRIDOR match — the ride surfaces when the driver's
 * cached route passes within MATCH_RADIUS_KM of BOTH the passenger's pickup AND drop, with the pickup
 * sitting *before* the drop along that route. So a ride shows even when the passenger's stops are
 * INTERMEDIATE points on the route, not just near the driver's own start/end. Ranked by total detour
 * (pickup + drop distance to the route). Rides with no cached geometry fall back to the straight line
 * between endpoints, so this is never worse than the old endpoint-only match.
 */
const MATCH_RADIUS_KM = 8;

/**
 * The polyline to corridor-match against: the ride's cached OSRM route when present, else a straight
 * line between its endpoints (OSRM was down when the ride was offered). [lng, lat] order throughout.
 */
function routeCoords(geo: unknown, origin: GeoPoint, destination: GeoPoint): LngLat[] {
  const line = geo as LineString | null;
  if (line?.type === "LineString" && Array.isArray(line.coordinates) && line.coordinates.length >= 2) {
    return line.coordinates;
  }
  return [
    [origin.lng, origin.lat],
    [destination.lng, destination.lat],
  ];
}

export const POST = withErrorHandler(async (req: Request) => {
  const { session, tenant } = await requirePermission("ride", "read");
  const q = findRideFormSchema.parse(await req.json());

  // The requested calendar day [00:00, next 00:00).
  const dayStart = new Date(q.date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

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
      driverName: user.name,
      vehicleModel: vehicle.model,
    })
    .from(ride)
    .leftJoin(user, eq(user.id, ride.driverId))
    .leftJoin(vehicle, eq(vehicle.id, ride.vehicleId))
    .where(
      scopedWhere(
        tenant,
        ride,
        and(
          eq(ride.status, "published"),
          ne(ride.driverId, session.user.id),
          gte(ride.departAt, dayStart),
          lte(ride.departAt, dayEnd),
          gte(ride.seatsAvailable, q.seats),
        ),
      ),
    )
    .orderBy(desc(ride.departAt));

  // Corridor match + rank: pickup AND drop must both lie within MATCH_RADIUS_KM of the ride's route,
  // and pickup must come before drop along it (right direction). Intermediate stops match, not just
  // the driver's endpoints. Ranked by total detour (closest corridor first).
  const matched = rows
    .map((r) => {
      const coords = routeCoords(r.routeGeoJSON, r.origin as GeoPoint, r.destination as GeoPoint);
      const { pickupKm, dropKm, ordered } = corridorMatch(q.origin, q.destination, coords);
      return { r, pickupKm, dropKm, ordered, detour: pickupKm + dropKm };
    })
    .filter((m) => m.ordered && m.pickupKm <= MATCH_RADIUS_KM && m.dropKm <= MATCH_RADIUS_KM)
    .sort((a, b) => a.detour - b.detour)
    .map((m) => ({ ...m.r, seatsRequested: q.seats }) as RideWithMeta);

  return ok(matched);
});
