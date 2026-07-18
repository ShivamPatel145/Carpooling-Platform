import { and, eq, gte, lte, ne, desc } from "drizzle-orm";
import { db } from "@/db";
import { ride, user, vehicle } from "@/db/schema";
import { findRideFormSchema, type RideWithMeta } from "@/features/ride/schema";
import { requirePermission, scopedWhere } from "@/lib/permissions";
import { withErrorHandler, ok } from "@/lib/api";
import { haversineKm } from "@/lib/osrm";
import type { GeoPoint } from "@/db/schema/ride";

/**
 * POST /api/ride/search — Find-a-ride matching. Server-side so the ranking (proximity) is trusted.
 *
 * Filters (SQL): same org (scopedWhere), status=published, departs within the requested day,
 * seatsAvailable ≥ requested, driver ≠ requester (you can't book your own ride).
 * Rank (JS, since origin/destination are jsonb): endpoints within MATCH_RADIUS_KM of both the
 * requested pickup AND drop, sorted by combined crow-flies detour. This is intentionally simple and
 * explainable for the demo — a corridor/segment match is the post-hackathon upgrade.
 */
const MATCH_RADIUS_KM = 8;

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

  // Proximity match + rank (crow-flies on the jsonb endpoints).
  const matched = rows
    .map((r) => {
      const o = r.origin as GeoPoint;
      const d = r.destination as GeoPoint;
      const oGap = haversineKm(q.origin, o);
      const dGap = haversineKm(q.destination, d);
      return { r, oGap, dGap, detour: oGap + dGap };
    })
    .filter((m) => m.oGap <= MATCH_RADIUS_KM && m.dGap <= MATCH_RADIUS_KM)
    .sort((a, b) => a.detour - b.detour)
    .map((m) => ({ ...m.r, seatsRequested: q.seats }) as RideWithMeta);

  return ok(matched);
});
