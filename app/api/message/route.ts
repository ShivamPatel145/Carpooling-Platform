import { and, asc, eq, inArray, isNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { message, user } from "@/db/schema";
import { requirePermission, scopedWhere } from "@/lib/permissions";
import { withErrorHandler, ok, created } from "@/lib/api";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { logActivity } from "@/lib/activity";
import { getParticipantContext } from "@/lib/trip-service";
import { pusherTrigger } from "@/lib/pusher/server";
import { PUSHER_EVENTS, tripChannel } from "@/lib/pusher/channels";
import { messageFormSchema, type MessageView } from "@/features/message/schema";

/**
 * Per-trip chat (PRD §7.7). Participant-only + org-scoped; a non-party (or cross-org) gets 404.
 * GET marks the other party's unread messages read (readAt) for the viewer. POST persists + broadcasts
 * on the SAME per-trip Pusher channel as tracking (one realtime system).
 */
export const GET = withErrorHandler(async (req: Request) => {
  const { session, tenant } = await requirePermission("message", "read");
  const tripId = new URL(req.url).searchParams.get("tripId");
  if (!tripId) throw new ValidationError("A tripId is required.");

  const ctx = await getParticipantContext(tenant, session.user.id, tripId);
  if (!ctx) throw new NotFoundError("That trip doesn't exist.");

  const rows = await db
    .select()
    .from(message)
    .where(scopedWhere(tenant, message, eq(message.tripId, tripId)))
    .orderBy(asc(message.createdAt));

  // Mark the counterparty's unread messages as read for this viewer.
  await db
    .update(message)
    .set({ readAt: new Date() })
    .where(
      scopedWhere(
        tenant,
        message,
        and(eq(message.tripId, tripId), ne(message.senderId, session.user.id), isNull(message.readAt)),
      ),
    );

  const senderIds = [...new Set(rows.map((r) => r.senderId))];
  const users = senderIds.length
    ? await db.select().from(user).where(inArray(user.id, senderIds))
    : [];
  const nameById = new Map(users.map((u) => [u.id, u.name]));

  const views: MessageView[] = rows.map((r) => ({
    id: r.id,
    tripId: r.tripId,
    senderId: r.senderId,
    senderName: nameById.get(r.senderId) ?? null,
    body: r.body,
    createdAt: new Date(r.createdAt).toISOString(),
    readAt: r.readAt ? new Date(r.readAt).toISOString() : null,
  }));
  return ok(views);
});

export const POST = withErrorHandler(async (req: Request) => {
  const { session, tenant } = await requirePermission("message", "create");
  const { tripId, body } = messageFormSchema.parse(await req.json());

  const ctx = await getParticipantContext(tenant, session.user.id, tripId);
  if (!ctx) throw new NotFoundError("That trip doesn't exist.");

  const [row] = await db
    .insert(message)
    .values({ orgId: tenant.orgId!, tripId, senderId: session.user.id, body })
    .returning();

  const view: MessageView = {
    id: row!.id,
    tripId,
    senderId: session.user.id,
    senderName: session.user.name ?? null,
    body: row!.body,
    createdAt: new Date(row!.createdAt).toISOString(),
    readAt: null,
  };

  await logActivity({
    orgId: tenant.orgId,
    actorId: session.user.id,
    action: "create",
    resource: "message",
    resourceId: row!.id,
    metadata: { tripId },
    req,
  });
  await pusherTrigger(tripChannel(tripId), PUSHER_EVENTS.message, view);

  return created(view);
});
