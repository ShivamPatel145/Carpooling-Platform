"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ride, supportTicket, supportTicketFormSchema } from "@/db/schema";
import { requirePermission, scopedWhere } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { NotFoundError } from "@/lib/errors";

/**
 * Raise a support ticket. RBAC-gated (only roles with supportTicket.create — employees — reach the
 * insert). The ticket is stamped with the requester's id + orgId from the session, never the client,
 * and re-validated server-side with the shared Zod schema. Closes with the audit trail.
 *
 * Report-an-issue: an optional rideId links the ticket to a ride (supportTicket.rideId). The ride is
 * fetched ORG-SCOPED first — a cross-org rideId is NotFound (404 semantics), never attached.
 */
export async function createSupportTicket(input: unknown) {
  const { session, tenant } = await requirePermission("supportTicket", "create");
  const values = supportTicketFormSchema.parse(input);

  // Validate the ride reference inside the requester's org before linking it.
  let rideId: string | null = null;
  if (values.rideId) {
    const [linked] = await db
      .select({ id: ride.id })
      .from(ride)
      .where(scopedWhere(tenant, ride, eq(ride.id, values.rideId)));
    if (!linked) throw new NotFoundError("That ride doesn't exist.");
    rideId = linked.id;
  }

  const [row] = await db
    .insert(supportTicket)
    .values({
      orgId: session.user.orgId ?? null,
      requesterId: session.user.id,
      subject: values.subject,
      description: values.description,
      priority: values.priority,
      rideId,
    })
    .returning({ id: supportTicket.id });

  await logActivity({
    orgId: session.user.orgId ?? null,
    actorId: session.user.id,
    action: "supportTicket.create",
    resource: "supportTicket",
    resourceId: row?.id ?? null,
    metadata: { subject: values.subject, priority: values.priority, rideId },
  });

  revalidatePath("/support");
  return { id: row?.id };
}
