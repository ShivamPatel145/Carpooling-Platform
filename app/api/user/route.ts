import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { userFormSchema } from "@/db/schema";
import { requirePermission, scopedWhere } from "@/lib/permissions";
import { withErrorHandler, created } from "@/lib/api";
import { ConflictError } from "@/lib/errors";
import { logActivity } from "@/lib/activity";
import { hashPassword } from "@/lib/password";
import { desc } from "drizzle-orm";

/**
 * GET /api/user — list users scoped to requester's org.
 *   company_admin: sees only own org (scopedWhere).
 *   super_admin is NOT expected here — they use /platform for cross-tenant views.
 *
 * POST /api/user — admin adds a new employee to own org.
 */

export const GET = withErrorHandler(async () => {
  const { tenant } = await requirePermission("user", "read");

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      platformAccess: user.platformAccess,
      department: user.department,
      manager: user.manager,
      officeLocation: user.officeLocation,
      phone: user.phone,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(scopedWhere(tenant, user))
    .orderBy(desc(user.createdAt));

  return NextResponse.json({ users: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const { session, tenant } = await requirePermission("user", "create");

  const body = await req.json();
  const data = userFormSchema.parse(body);

  const existing = await db.query.user.findFirst({
    where: eq(user.email, data.email.toLowerCase()),
  });
  if (existing) throw new ConflictError("An account with that email already exists.");

  // Generate a temporary password if provided, otherwise set a placeholder
  const rawPassword = (body.password as string) ?? "ChangeMe123!";
  const passwordHash = await hashPassword(rawPassword);

  const [created_user] = await db
    .insert(user)
    .values({
      orgId: tenant.orgId,
      email: data.email.toLowerCase(),
      name: data.name,
      phone: data.phone ?? null,
      role: data.role,
      status: data.status,
      platformAccess: data.platformAccess,
      department: data.department ?? null,
      manager: data.manager ?? null,
      officeLocation: data.officeLocation ?? null,
      passwordHash,
    })
    .returning({ id: user.id, email: user.email, name: user.name, role: user.role });

  await logActivity({
    actorId: session.user.id,
    action: "create",
    resource: "user",
    resourceId: created_user!.id,
    req,
  });

  return created({ user: created_user });
});
