import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { booking, ride, trip } from "@/db/schema";
import { requirePermission, scopedWhere } from "@/lib/permissions";
import { withErrorHandler } from "@/lib/api";
import { ForbiddenError } from "@/lib/errors";
import { pusherServer } from "@/lib/pusher/server";
import { tripIdFromChannel } from "@/lib/pusher/channels";

/**
 * POST /api/pusher/auth — authorizes a private trip channel subscription. pusher-js posts
 * { socket_id, channel_name } (form-encoded). We authorize ONLY if the signed-in user is a
 * participant (driver or confirmed passenger) of the trip in the channel name, org-scoped — so a
 * user can't subscribe to another trip's live location or chat. Mirrors the API's tenancy rule.
 */
export const POST = withErrorHandler(async (req: Request) => {
  const { session, tenant } = await requirePermission("trip", "track");
  const userId = session.user.id;
  if (!pusherServer) throw new ForbiddenError("Realtime is not configured.");

  const form = await req.formData();
  const socketId = String(form.get("socket_id") ?? "");
  const channel = String(form.get("channel_name") ?? "");
  const tripId = tripIdFromChannel(channel);
  if (!socketId || !tripId) throw new ForbiddenError("Invalid channel.");

  const [t] = await db.select().from(trip).where(scopedWhere(tenant, trip, eq(trip.id, tripId)));
  if (!t) throw new ForbiddenError("You can't subscribe to that trip.");
  const [r] = await db.select().from(ride).where(scopedWhere(tenant, ride, eq(ride.id, t.rideId)));
  const isDriver = r?.driverId === userId;
  const myBooking = await db
    .select()
    .from(booking)
    .where(scopedWhere(tenant, booking, and(eq(booking.rideId, t.rideId), eq(booking.passengerId, userId))));
  if (!isDriver && myBooking.length === 0) {
    throw new ForbiddenError("You can't subscribe to that trip.");
  }

  const authResponse = pusherServer.authorizeChannel(socketId, channel);
  return NextResponse.json(authResponse);
});
