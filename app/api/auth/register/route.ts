import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { user } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { logActivity } from "@/lib/activity";
import { withErrorHandler } from "@/lib/api";
import { ConflictError } from "@/lib/errors";

/**
 * Credentials sign-up. Public (no requirePermission) — this is how new external users self-register.
 * Creates an "employee" with status "pending" (awaits org approval — carpooling onboarding Path 3;
 * org mapping/approval is a build-day slice). Role changes happen via the admin console in Slice C.
 */
const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("A valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const POST = withErrorHandler(async (req: Request) => {
  const body = registerSchema.parse(await req.json());
  const email = body.email.toLowerCase();

  const existing = await db.query.user.findFirst({ where: eq(user.email, email) });
  if (existing) throw new ConflictError("An account with that email already exists.");

  const passwordHash = await hashPassword(body.password);
  const [created] = await db
    .insert(user)
    .values({ name: body.name, email, passwordHash, role: "employee", status: "pending" })
    .returning({ id: user.id, email: user.email, name: user.name, role: user.role });

  await logActivity({
    actorId: created!.id,
    action: "register",
    resource: "user",
    resourceId: created!.id,
    req,
  });

  return NextResponse.json({ user: created }, { status: 201 });
});
