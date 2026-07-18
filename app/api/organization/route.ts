import { NextResponse } from "next/server";
import { db } from "@/db";
import { organization, invitation } from "@/db/schema";
import { organizationFormSchema, inviteFormSchema } from "@/db/schema";
import { requirePermission, requireSuperAdmin } from "@/lib/permissions";
import { withErrorHandler, created } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { sendNotificationEmail } from "@/lib/email";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";

/**
 * GET /api/organization — list ALL orgs (super_admin cross-tenant only).
 * POST /api/organization — create a new org + optionally invite the first company_admin.
 */

export const GET = withErrorHandler(async () => {
  await requireSuperAdmin();
  const rows = await db
    .select()
    .from(organization)
    .orderBy(desc(organization.createdAt));
  return NextResponse.json({ organizations: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const { session } = await requireSuperAdmin();
  const body = await req.json();

  // Parse org fields
  const orgData = organizationFormSchema.parse(body);

  const [org] = await db
    .insert(organization)
    .values({
      name: orgData.name,
      allowedEmailDomains: orgData.allowedEmailDomains,
      currency: orgData.currency,
      fuelCostPerKm: String(orgData.fuelCostPerKm),
      travelCostPerKm: String(orgData.travelCostPerKm),
      maintenanceMonthly: String(orgData.maintenanceMonthly),
      autoApproveDomain: orgData.autoApproveDomain,
    })
    .returning();

  await logActivity({
    actorId: session.user.id,
    action: "create",
    resource: "organization",
    resourceId: org!.id,
    req,
  });

  // Optionally send an admin invite right after creation
  const inviteBody = body.invite as { email?: string } | undefined;
  if (inviteBody?.email) {
    const inviteData = inviteFormSchema.parse({ email: inviteBody.email, role: "company_admin" });
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(invitation).values({
      orgId: org!.id,
      email: inviteData.email,
      role: "company_admin",
      token,
      status: "pending",
      expiresAt,
    });

    const acceptUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/accept-invite?token=${token}`;
    await sendNotificationEmail(inviteData.email, `You've been invited to manage ${org!.name} on Carpooling Platform`, {
      title: `Welcome to ${org!.name}!`,
      body: `You've been invited as the Company Admin for ${org!.name}. Click below to set up your account.`,
      ctaLabel: "Accept Invitation",
      ctaUrl: acceptUrl,
    });
  }

  return created({ organization: org });
});
