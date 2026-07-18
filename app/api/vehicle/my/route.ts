import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { vehicle } from "@/db/schema";
import { requirePermission, scopedWhere } from "@/lib/permissions";
import { withErrorHandler, ok } from "@/lib/api";

/**
 * GET /api/vehicle/my           — the current user's own vehicles (org-scoped + owner-scoped).
 * GET /api/vehicle/my?approved=1 — only the user's APPROVED vehicles (the Offer-a-Ride picker pool).
 *
 * Still runs through scopedWhere so the org filter is never skipped, then narrows to ownerId.
 */
export const GET = withErrorHandler(async (req: Request) => {
  const { session, tenant } = await requirePermission("vehicle", "read");
  const approvedOnly = new URL(req.url).searchParams.get("approved") === "1";

  const ownerClause = eq(vehicle.ownerId, session.user.id);
  const clause = approvedOnly
    ? and(ownerClause, eq(vehicle.approvalStatus, "approved"))
    : ownerClause;

  const rows = await db
    .select()
    .from(vehicle)
    .where(scopedWhere(tenant, vehicle, clause))
    .orderBy(desc(vehicle.createdAt));
  return ok(rows);
});
