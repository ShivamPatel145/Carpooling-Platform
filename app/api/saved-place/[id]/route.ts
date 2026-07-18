import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { savedPlace } from "@/db/schema";
import { savedPlaceFormSchema } from "@/features/saved-place/schema";
import { requirePermission, scopedWhere } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { withErrorHandler, ok, noContent } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Saved places are strictly personal. Every query is scoped to org AND userId, so another user's (or
 * another org's) place is simply not found → 404, never 403.
 */
async function ownPlace(tenant: Awaited<ReturnType<typeof requirePermission>>["tenant"], userId: string, id: string) {
  const [row] = await db
    .select()
    .from(savedPlace)
    .where(scopedWhere(tenant, savedPlace, and(eq(savedPlace.id, id), eq(savedPlace.userId, userId))));
  return row;
}

export const GET = withErrorHandler(async (_req: Request, { params }: Ctx) => {
  const { session, tenant } = await requirePermission("savedPlace", "read");
  const { id } = await params;
  const row = await ownPlace(tenant, session.user.id, id);
  if (!row) throw new NotFoundError("That place doesn't exist.");
  return ok(row);
});

export const PATCH = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const { session, tenant } = await requirePermission("savedPlace", "update");
  const { id } = await params;
  const existing = await ownPlace(tenant, session.user.id, id);
  if (!existing) throw new NotFoundError("That place doesn't exist.");

  const values = savedPlaceFormSchema.parse(await req.json());
  const [row] = await db
    .update(savedPlace)
    .set({
      label: values.label,
      lat: String(values.lat),
      lng: String(values.lng),
      address: values.address || null,
    })
    .where(eq(savedPlace.id, id))
    .returning();

  await logActivity({
    orgId: tenant.orgId,
    actorId: session.user.id,
    action: "update",
    resource: "savedPlace",
    resourceId: id,
    req,
  });

  return ok(row);
});

export const DELETE = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const { session, tenant } = await requirePermission("savedPlace", "delete");
  const { id } = await params;
  const existing = await ownPlace(tenant, session.user.id, id);
  if (!existing) throw new NotFoundError("That place doesn't exist.");

  await db.delete(savedPlace).where(eq(savedPlace.id, id));
  await logActivity({
    orgId: tenant.orgId,
    actorId: session.user.id,
    action: "delete",
    resource: "savedPlace",
    resourceId: id,
    req,
  });

  return noContent();
});
