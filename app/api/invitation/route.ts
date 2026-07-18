import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db } from "@/db";
import { invitation } from "@/db/schema";
import { inviteFormSchema } from "@/db/schema";
import { requirePermission, requireSuperAdmin, scopedWhere } from "@/lib/permissions";
import { withErrorHandler, created } from "@/lib/api";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { logActivity } from "@/lib/activity";
import { sendNotificationEmail } from "@/lib/email";
import { desc } from "drizzle-orm";

/**
 * GET /api/invitation — list pending invitations.
 *   super_admin: across all orgs.
 *   company_admin: own org only (scopedWhere).
 *
 * POST /api/invitation — create + send tokenized invite email.
 *   super_admin → can invite company_admin for any org.
 *   company_admin → invites employees into own org.
 */

export const GET = withErrorHandler(async () => {
  // Try super_admin, fall back to company_admin
  let isSuperAdmin = false;
  let tenant;
  try {
    const result = await requireSuperAdmin();
    tenant = result.tenant;
    isSuperAdmin = true;
  } catch {
    const result = await requirePermission("invitation", "read");
    tenant = result.tenant;
  }

  const where = isSuperAdmin ? undefined : scopedWhere(tenant, invitation);
  const rows = await db
    .select()
    .from(invitation)
    .where(where)
    .orderBy(desc(invitation.createdAt));

  return NextResponse.json({ invitations: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  let isSuperAdmin = false;
  let session, tenant;
  try {
    const result = await requireSuperAdmin();
    session = result.session;
    tenant = result.tenant;
    isSuperAdmin = true;
  } catch {
    const result = await requirePermission("invitation", "create");
    session = result.session;
    tenant = result.tenant;
  }

  const body = await req.json();
  const { email, role } = inviteFormSchema.parse(body);

  // super_admin must provide orgId; company_admin uses own orgId
  const orgId: string = isSuperAdmin
    ? (body.orgId as string)
    : (tenant.orgId as string);

  if (!orgId) {
    throw new NotFoundError("orgId is required for super_admin invitations.");
  }

  // Prevent duplicate pending invite for same email+org
  const existing = await db.query.invitation.findFirst({
    where: eq(invitation.email, email.toLowerCase()),
  });
  if (existing && existing.status === "pending" && existing.orgId === orgId) {
    throw new ConflictError("A pending invitation already exists for this email.");
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const [inv] = await db
    .insert(invitation)
    .values({ orgId, email: email.toLowerCase(), role, token, status: "pending", expiresAt })
    .returning();

  const acceptUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/accept-invite?token=${token}`;
  await sendNotificationEmail(
    email,
    `You've been invited to join the Carpooling Platform`,
    {
      heading: "You're invited!",
      body: `You've been invited as ${role === "company_admin" ? "Company Admin" : "an Employee"}. Accept before ${expiresAt.toLocaleDateString()}.`,
      ctaLabel: "Accept Invitation",
      ctaUrl: acceptUrl,
    },
  );

  await logActivity({
    actorId: session.user.id,
    action: "create",
    resource: "invitation",
    resourceId: inv!.id,
    req,
  });

  return created({ invitation: inv });
});
