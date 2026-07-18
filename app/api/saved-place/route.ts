import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { savedPlace } from "@/db/schema";
import { savedPlaceFormSchema } from "@/features/saved-place/schema";
import { requirePermission, scopedWhere } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { withErrorHandler, ok, created } from "@/lib/api";

/**
 * GET  /api/saved-place — the caller's own saved places (org-scoped + userId), newest first.
 * POST /api/saved-place — create one for the caller. (PRD §7.14 — copied from features/_demo.)
 */
export const GET = withErrorHandler(async () => {
  const { session, tenant } = await requirePermission("savedPlace", "read");
  const rows = await db
    .select()
    .from(savedPlace)
    .where(scopedWhere(tenant, savedPlace, eq(savedPlace.userId, session.user.id)))
    .orderBy(desc(savedPlace.createdAt));
  return ok(rows);
});

export const POST = withErrorHandler(async (req: Request) => {
  const { session, tenant } = await requirePermission("savedPlace", "create");
  const values = savedPlaceFormSchema.parse(await req.json());

  const [row] = await db
    .insert(savedPlace)
    .values({
      orgId: tenant.orgId!,
      userId: session.user.id,
      label: values.label,
      lat: String(values.lat),
      lng: String(values.lng),
      address: values.address || null,
    })
    .returning();

  await logActivity({
    orgId: tenant.orgId,
    actorId: session.user.id,
    action: "create",
    resource: "savedPlace",
    resourceId: row!.id,
    metadata: { label: row!.label },
    req,
  });

  return created(row);
});
