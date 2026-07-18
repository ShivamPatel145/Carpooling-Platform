import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { ride, vehicle, user } from "@/db/schema";
import { offerRideFormSchema } from "@/features/ride/schema";
import { requirePermission, scopedWhere } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { withErrorHandler, ok, created } from "@/lib/api";
import { ForbiddenError } from "@/lib/errors";
import { route as osrmRoute } from "@/lib/osrm";

/**
 * GET  /api/ride  — upcoming published rides in the org (the pool Find searches). Org-scoped.
 * POST /api/ride  — publish a ride. Validates the vehicle is the caller's AND approved, then caches
 *                   the OSRM road route (geometry + distance + duration) on the row so no view
 *                   re-routes. numeric columns take strings (Drizzle).
 */
export const GET = withErrorHandler(async () => {
  const { tenant } = await requirePermission("ride", "read");
  const rows = await db
    .select()
    .from(ride)
    .where(scopedWhere(tenant, ride, eq(ride.status, "published")))
    .orderBy(desc(ride.departAt));
  return ok(rows);
});

export const POST = withErrorHandler(async (req: Request) => {
  const { session, tenant } = await requirePermission("ride", "create");
  const values = offerRideFormSchema.parse(await req.json());

  // The vehicle must belong to the caller, be in-org, and be APPROVED. Scoped fetch → cross-org 404
  // semantics collapse to "not a valid choice" here (we throw Forbidden with a clear reason).
  const [veh] = await db
    .select()
    .from(vehicle)
    .where(scopedWhere(tenant, vehicle, eq(vehicle.id, values.vehicleId)));
  if (!veh || veh.ownerId !== session.user.id) {
    throw new ForbiddenError("That vehicle isn't yours.");
  }
  if (veh.approvalStatus !== "approved") {
    throw new ForbiddenError("That vehicle isn't approved yet — an admin must approve it first.");
  }

  // Cache the route from OSRM. Degrades gracefully: if OSRM is down we still publish, just without
  // cached geometry (the map falls back to a straight line at view time).
  const routed = await osrmRoute(values.origin, values.destination);

  const [row] = await db
    .insert(ride)
    .values({
      orgId: tenant.orgId!,
      driverId: session.user.id,
      vehicleId: values.vehicleId,
      origin: values.origin,
      destination: values.destination,
      departAt: values.departAt,
      seatsTotal: values.seatsTotal,
      seatsAvailable: values.seatsTotal,
      farePerSeat: values.farePerSeat.toFixed(2),
      routeGeoJSON: routed?.geometry ?? null,
      distanceKm: routed ? routed.distanceKm.toFixed(2) : null,
      durationMin: routed?.durationMin ?? null,
      isRecurring: values.isRecurring,
      recurrenceRule: values.recurrenceRule || null,
      status: "published",
    })
    .returning();

  await logActivity({
    orgId: tenant.orgId,
    actorId: session.user.id,
    action: "create",
    resource: "ride",
    resourceId: row!.id,
    metadata: {
      from: values.origin.label,
      to: values.destination.label,
      seats: values.seatsTotal,
      routed: Boolean(routed),
    },
    req,
  });

  return created(row);
});
