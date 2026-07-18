import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ride, user, vehicle } from "@/db/schema";
import { requirePermission, scopedWhere } from "@/lib/permissions";
import { withErrorHandler, ok } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/ride/:id — one ride, org-scoped, enriched with driver + vehicle names for the detail /
 * booking screen. Cross-org id → returns nothing → 404 (never 403), per the tenancy rule.
 */
export const GET = withErrorHandler(async (_req: Request, { params }: Ctx) => {
  const { tenant } = await requirePermission("ride", "read");
  const { id } = await params;

  const [row] = await db
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
    .where(scopedWhere(tenant, ride, eq(ride.id, id)));

  if (!row) throw new NotFoundError("That ride doesn't exist.");
  return ok(row);
});
