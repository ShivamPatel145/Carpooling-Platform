import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { atLeast, hasPermission, type Action, type Resource, type Role } from "@/lib/permissions";

/**
 * Server-component session helpers. This is where FULL role/session validation happens (the Edge
 * middleware only checks cookie presence — rbac-guard rule #5). Use these in layouts and pages.
 */

/** The home route for a role — where redirects land people (carpooling three consoles). */
export function homeForRole(role: Role): string {
  if (role === "super_admin") return "/platform";
  if (role === "company_admin") return "/admin";
  return "/app";
}

/** Return the session or redirect to /login (with a return path). Refuses revoked access. */
export async function requireSession(callbackUrl?: string) {
  const session = await auth();
  if (!session?.user) {
    const target = callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login";
    redirect(target);
  }
  if (session.user.platformAccess === "revoked") {
    redirect("/login?error=access_revoked");
  }
  return session;
}

/** Return the session if the user meets a minimum role, else redirect to their own home. */
export async function requireRolePage(min: Role, callbackUrl?: string) {
  const session = await requireSession(callbackUrl);
  if (!atLeast(session.user.role, min)) {
    redirect(homeForRole(session.user.role));
  }
  return session;
}

/** Super-admin-only page gate (the cross-tenant platform console). Redirects everyone else home. */
export async function requireSuperAdminPage(callbackUrl?: string) {
  const session = await requireSession(callbackUrl);
  if (session.user.role !== "super_admin") {
    redirect(homeForRole(session.user.role));
  }
  return session;
}

/**
 * Page-level permission gate that REDIRECTS instead of throwing (throwing is for API routes via
 * requirePermission). Use in server pages to bounce a role that can't view the page.
 */
export async function requirePermissionPage<R extends Resource>(
  resource: R,
  action: Action<R>,
  callbackUrl?: string,
) {
  const session = await requireSession(callbackUrl);
  if (!hasPermission(session.user.role, resource, action)) {
    redirect(homeForRole(session.user.role));
  }
  return session;
}

/** Just the current user (or null) — for optional gating. */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}
