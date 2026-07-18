import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invitation, user, organization } from "@/db/schema";
import { acceptInviteSchema } from "@/db/schema";
import { withErrorHandler, created } from "@/lib/api";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { hashPassword } from "@/lib/password";
import { logActivity } from "@/lib/activity";

/**
 * POST /api/invitation/accept — Onboarding Path 1 & 2 finalizer.
 * Validates the token, creates (or updates) the user, assigns orgId + role, marks invite accepted.
 * After this, Auth.js credentials sign-in lands them at homeForRole (super_admin→/platform,
 * company_admin→/admin, employee→/app via lib/session.homeForRole).
 *
 * Public — no requirePermission (the invite token IS the auth for this action).
 */

export const POST = withErrorHandler(async (req: Request) => {
  const body = acceptInviteSchema.parse(await req.json());

  const inv = await db.query.invitation.findFirst({
    where: eq(invitation.token, body.token),
  });

  if (!inv) throw new NotFoundError("Invitation not found or already used.");
  if (inv.status !== "pending") {
    throw new ValidationError("This invitation has already been used or has expired.");
  }
  if (inv.expiresAt < new Date()) {
    await db.update(invitation).set({ status: "expired" }).where(eq(invitation.id, inv.id));
    throw new ValidationError("This invitation has expired. Please request a new one.");
  }

  const org = await db.query.organization.findFirst({
    where: eq(organization.id, inv.orgId),
  });
  if (!org) throw new NotFoundError("Organization not found.");

  // Check if user already exists (re-inviting)
  const existing = await db.query.user.findFirst({
    where: eq(user.email, inv.email),
  });

  const passwordHash = await hashPassword(body.password);

  let newUser;
  if (existing) {
    // Update existing user with new org assignment and role
    [newUser] = await db
      .update(user)
      .set({
        orgId: inv.orgId,
        role: inv.role,
        name: body.name,
        phone: body.phone ?? null,
        status: "active",
        platformAccess: "active",
        passwordHash,
      })
      .where(eq(user.id, existing.id))
      .returning({ id: user.id, email: user.email, role: user.role });
  } else {
    [newUser] = await db
      .insert(user)
      .values({
        orgId: inv.orgId,
        email: inv.email,
        name: body.name,
        phone: body.phone ?? null,
        role: inv.role,
        status: "active",
        platformAccess: "active",
        passwordHash,
      })
      .returning({ id: user.id, email: user.email, role: user.role });
  }

  // Mark invite as accepted
  await db.update(invitation).set({ status: "accepted" }).where(eq(invitation.id, inv.id));

  await logActivity({
    actorId: newUser!.id,
    action: "create",
    resource: "user",
    resourceId: newUser!.id,
    req,
  });

  return created({
    user: { id: newUser!.id, email: newUser!.email, role: newUser!.role },
    orgName: org.name,
  });
});
