import { requirePermission } from "@/lib/permissions";
import { withErrorHandler, ok } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";
import { getTripViewById } from "@/lib/trip-service";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/trip/:id — one enriched trip (with route geometry for the map). Returns 404 — NOT 403 —
 * when the trip is in another org OR the caller isn't a participant (the two are indistinguishable
 * to the caller, per the tenancy rule). This is the RBAC negative surface: a Globex user requesting
 * an Acme trip id gets 404 here.
 */
export const GET = withErrorHandler(async (_req: Request, { params }: Ctx) => {
  const { session, tenant } = await requirePermission("trip", "read");
  const { id } = await params;
  const view = await getTripViewById(tenant, session.user.id, id);
  if (!view) throw new NotFoundError("That trip doesn't exist.");
  return ok(view);
});
