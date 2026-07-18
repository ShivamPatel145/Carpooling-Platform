import { z } from "zod";
import { requirePermission } from "@/lib/permissions";
import { withErrorHandler, ok, created } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { createTripForRide, getMyTripViews, getTripViewById } from "@/lib/trip-service";

/**
 * GET  /api/trip  — the caller's trips (as driver OR passenger), org-scoped, enriched. Lazily
 *                   materializes trips from confirmed bookings (the booking→trip handoff, Slice B).
 * POST /api/trip  — explicitly start a trip from a ride ({ rideId }); idempotent (one trip per ride).
 *
 * Every handler opens with requirePermission; the mutation closes with logActivity (generic-crud +
 * rbac-guard). Tenancy is applied inside the service via scopedWhere.
 */
export const GET = withErrorHandler(async () => {
  const { session, tenant } = await requirePermission("trip", "read");
  const trips = await getMyTripViews(tenant, session.user.id);
  return ok(trips);
});

const createTripSchema = z.object({ rideId: z.string().uuid("A rideId is required") });

export const POST = withErrorHandler(async (req: Request) => {
  const { session, tenant } = await requirePermission("trip", "create");
  const { rideId } = createTripSchema.parse(await req.json());

  const t = await createTripForRide(tenant, session.user.id, rideId);

  await logActivity({
    orgId: tenant.orgId,
    actorId: session.user.id,
    action: "create",
    resource: "trip",
    resourceId: t.id,
    metadata: { rideId },
    req,
  });

  const view = await getTripViewById(tenant, session.user.id, t.id);
  return created(view);
});
