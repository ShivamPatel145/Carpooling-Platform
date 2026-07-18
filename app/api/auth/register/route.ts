import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { user, organization } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { logActivity } from "@/lib/activity";
import { withErrorHandler } from "@/lib/api";
import { ConflictError, ValidationError } from "@/lib/errors";

/**
 * Credentials sign-up — Onboarding Path 3.
 * Matches the email domain against every org's allowedEmailDomains.
 *   - Match found + autoApproveDomain=true  → status="active"  (immediate access)
 *   - Match found + autoApproveDomain=false → status="pending" (waits in admin approval queue)
 *   - No match                              → 400 with a clear message
 *
 * After creation, homeForRole (lib/session.ts) routes them to /app (employee).
 * Super_admin and company_admin are created via invitations (Paths 1 & 2), never self-register.
 */
const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("A valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  phone: z.string().max(20).optional().or(z.literal("")),
});

export const POST = withErrorHandler(async (req: Request) => {
  const body = registerSchema.parse(await req.json());
  const email = body.email.toLowerCase();

  // Duplicate check
  const existing = await db.query.user.findFirst({ where: eq(user.email, email) });
  if (existing) throw new ConflictError("An account with that email already exists.");

  // Domain matching — Path 3 org assignment
  const emailDomain = email.split("@")[1];
  const allOrgs = await db.select().from(organization);

  const matchedOrg = allOrgs.find((org) =>
    org.allowedEmailDomains.some(
      (d) => d.toLowerCase() === emailDomain || d.toLowerCase().replace(/^@/, "") === emailDomain,
    ),
  );

  if (!matchedOrg) {
    throw new ValidationError(
      `No organization is configured for the domain "@${emailDomain}". ` +
        "Please use your company email or ask your admin for an invitation.",
    );
  }

  // autoApproveDomain controls immediate vs. queued activation
  const status = matchedOrg.autoApproveDomain ? "active" : "pending";

  const passwordHash = await hashPassword(body.password);
  const [created] = await db
    .insert(user)
    .values({
      name: body.name,
      email,
      phone: body.phone ?? null,
      passwordHash,
      role: "employee",
      status,
      orgId: matchedOrg.id,
    })
    .returning({ id: user.id, email: user.email, name: user.name, role: user.role, status: user.status });

  await logActivity({
    actorId: created!.id,
    action: "register",
    resource: "user",
    resourceId: created!.id,
    req,
  });

  return NextResponse.json({ user: created }, { status: 201 });
});
