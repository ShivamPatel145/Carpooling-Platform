"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { supportTicket, supportTicketFormSchema } from "@/db/schema";
import { requirePermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";

/**
 * Raise a support ticket. RBAC-gated (only roles with supportTicket.create — employees — reach the
 * insert). The ticket is stamped with the requester's id + orgId from the session, never the client,
 * and re-validated server-side with the shared Zod schema. Closes with the audit trail.
 */
export async function createSupportTicket(input: unknown) {
  const { session } = await requirePermission("supportTicket", "create");
  const values = supportTicketFormSchema.parse(input);

  const [row] = await db
    .insert(supportTicket)
    .values({
      orgId: session.user.orgId ?? null,
      requesterId: session.user.id,
      subject: values.subject,
      description: values.description,
      priority: values.priority,
    })
    .returning({ id: supportTicket.id });

  await logActivity({
    orgId: session.user.orgId ?? null,
    actorId: session.user.id,
    action: "supportTicket.create",
    resource: "supportTicket",
    resourceId: row?.id ?? null,
    metadata: { subject: values.subject, priority: values.priority },
  });

  revalidatePath("/support");
  return { id: row?.id };
}
