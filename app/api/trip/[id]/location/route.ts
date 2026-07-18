import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ride, trip } from "@/db/schema";
import { requirePermission, scopedWhere } from "@/lib/permissions";
import { withErrorHandler, ok } from "@/lib/api";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { writeTripEvent } from "@/lib/trip-service";
import { pusherTrigger } from "@/lib/pusher/server";
import { PUSHER_EVENTS, tripChannel } from "@/lib/pusher/channels";
import { tripLocationSchema } from "@/features/trip/schema";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/trip/:id/location — the driver's location ping (PRD §7.6). Driver-only, and only while
 * the trip is live (started/in_progress). Updates trip.driverLat/Lng/etaMin (the polling-fallback
 * source of truth), appends a `location` tripEvent, and broadcasts on the trip's Pusher channel.
 * The first ping auto-advances started → in_progress. High-frequency, so it does NOT logActivity —
 * the tripEvent stream is the audit trail here.
 */
export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const { session, tenant } = await requirePermission("trip", "track");
  const { id } = await params;
  const { lat, lng, etaMin } = tripLocationSchema.parse(await req.json());
  const userId = session.user.id;

  const [t] = await db.select().from(trip).where(scopedWhere(tenant, trip, eq(trip.id, id)));
  if (!t) throw new NotFoundError("That trip doesn't exist.");
  const [r] = await db.select().from(ride).where(scopedWhere(tenant, ride, eq(ride.id, t.rideId)));
  if (!r) throw new NotFoundError("That trip doesn't exist.");
  if (r.driverId !== userId) throw new ForbiddenError("Only the driver can broadcast location.");
  if (t.status !== "started" && t.status !== "in_progress") {
    throw new AppError("Location can only be posted while the trip is live.", 409, "NOT_LIVE");
  }

  const nextStatus = t.status === "started" ? "in_progress" : t.status;
  const etaValue = etaMin ?? t.etaMin ?? null;
  await db
    .update(trip)
    .set({ driverLat: String(lat), driverLng: String(lng), etaMin: etaValue, status: nextStatus })
    .where(eq(trip.id, id));

  await writeTripEvent(tenant.orgId!, id, "location", { lat, lng, etaMin: etaValue });
  if (nextStatus !== t.status) {
    await writeTripEvent(tenant.orgId!, id, nextStatus, { auto: true, via: "location" });
    await pusherTrigger(tripChannel(id), PUSHER_EVENTS.status, { status: nextStatus });
  }
  await pusherTrigger(tripChannel(id), PUSHER_EVENTS.location, {
    lat,
    lng,
    etaMin: etaValue,
    status: nextStatus,
    at: new Date().toISOString(),
  });

  return ok({ ok: true, status: nextStatus, lat, lng, etaMin: etaValue });
});
