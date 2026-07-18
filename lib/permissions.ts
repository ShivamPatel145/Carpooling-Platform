import { and, eq, type SQL } from "drizzle-orm";
import { auth } from "@/auth";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import type { UserRole } from "@/db/schema/user";

/**
 * RBAC + MULTI-TENANCY — the single source of truth for authorization (docs/PRD.md §4–§5,
 * .claude/skills/rbac-guard). Carpooling is multi-tenant: every non-super-admin query is scoped to
 * the requester's orgId, enforced HERE, not per-route. Super Admin is the one deliberate exception,
 * via a separate named path (requireSuperAdmin). Cross-org access → 404, never 403.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 * The four rules the whole team follows:
 *   1. Every route/action opens with requirePermission(resource, action) BEFORE touching data.
 *   2. New resource/action pairs go in `statement`. Per-role sets DERIVE from it.
 *   3. Ownership-scoped access uses canX(role, ownerId, userId). Org scoping uses scopedWhere(...).
 *   4. Gate BOTH layers — UI hides, API enforces. A hidden nav item is not authorization.
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 */

export type Role = UserRole; // "super_admin" | "company_admin" | "employee"
export const ALL_ROLES: readonly Role[] = ["super_admin", "company_admin", "employee"] as const;

// ── 1. STATEMENT — resource → allowed actions (single source of truth) ───────────────────────
export const statement = {
  // platform / tenancy (super_admin territory; company_admin reads/updates own org)
  organization: ["create", "read", "update", "delete"],
  invitation: ["create", "read", "revoke"],
  // people & fleet (company_admin manages; employee manages own)
  user: ["create", "read", "update", "delete", "approve", "revokeAccess"],
  vehicle: ["create", "read", "update", "delete", "approve"],
  savedPlace: ["create", "read", "update", "delete"],
  // ride engine (employee)
  ride: ["create", "read", "update", "delete", "cancel"],
  booking: ["create", "read", "update", "delete", "cancel"],
  // trips / realtime / chat (employee)
  trip: ["create", "read", "update", "track"],
  message: ["create", "read"],
  // money (employee)
  payment: ["create", "read"],
  wallet: ["read", "recharge", "spend"],
  // cross-cutting (kept from Phase 0)
  notification: ["read", "update"],
  activityLog: ["read"],
  setting: ["read", "update"],
  supportTicket: ["create", "read", "update", "assign", "resolve"],
  report: ["read", "export"],
  // the CRUD copy template — kept live so features/_demo stays demonstrable
  demoEntity: ["create", "read", "update", "delete", "approve"],
} as const;

export type Resource = keyof typeof statement;
export type Action<R extends Resource = Resource> = (typeof statement)[R][number];

const all = <R extends Resource>(r: R): readonly Action<R>[] => statement[r];

// ── 2. ROLES — per-role permission SETS, derived from the statement ──────────────────────────
type RolePermissions = { [R in Resource]?: readonly Action<R>[] };

export const roles: Record<Role, RolePermissions> = {
  // Platform operator — cross-tenant; NEVER operates a ride (no ride/booking/trip/payment).
  super_admin: {
    organization: all("organization"),
    invitation: ["create", "read", "revoke"],
    user: ["read"],
    activityLog: ["read"],
    report: ["read"],
    notification: ["read", "update"],
  },
  // One per org; configuration only, no ride operations. Scoped to own orgId.
  company_admin: {
    organization: ["read", "update"],
    invitation: ["create", "read", "revoke"],
    user: ["create", "read", "update", "approve", "revokeAccess"],
    vehicle: ["read", "update", "approve", "create"], // may register/approve on behalf
    activityLog: ["read"],
    setting: ["read", "update"],
    supportTicket: ["read", "update", "assign", "resolve"],
    report: ["read", "export"],
    notification: ["read", "update"],
  },
  // The primary user — mode-switcher. Scoped to own orgId + own records (ownership helpers).
  employee: {
    vehicle: ["create", "read", "update", "delete"],
    savedPlace: all("savedPlace"),
    ride: all("ride"),
    booking: all("booking"),
    trip: ["create", "read", "update", "track"],
    message: all("message"),
    payment: all("payment"),
    wallet: all("wallet"),
    supportTicket: ["create", "read"],
    report: ["read"],
    notification: ["read", "update"],
    demoEntity: ["create", "read", "update", "delete"],
  },
};

// ── 3. HIERARCHY — numeric; higher wins comparisons ──────────────────────────────────────────
export const roleHierarchy: Record<Role, number> = {
  super_admin: 100,
  company_admin: 50,
  employee: 10,
};

/** Does `role` grant `action` on `resource`? Pure, synchronous — safe on client and server. */
export function hasPermission(role: Role, resource: Resource, action: string): boolean {
  const set = roles[role]?.[resource] as readonly string[] | undefined;
  return set?.includes(action) ?? false;
}

/** Is `role` at least as privileged as `min`? */
export function atLeast(role: Role, min: Role): boolean {
  return roleHierarchy[role] >= roleHierarchy[min];
}

// ── 4. OWNERSHIP HELPERS — record-level, layered on top of org scoping ───────────────────────

/** Can edit if company_admin-or-above, OR owns the record. */
export function canEdit(role: Role, ownerId: string, userId: string): boolean {
  return atLeast(role, "company_admin") || ownerId === userId;
}

/** Can delete if company_admin-or-above, OR owns the record. */
export function canDelete(role: Role, ownerId: string, userId: string): boolean {
  return atLeast(role, "company_admin") || ownerId === userId;
}

/** Can view a record if company_admin-or-above, OR owns it. (Org scoping already applied.) */
export function canView(role: Role, ownerId: string, userId: string): boolean {
  return atLeast(role, "company_admin") || ownerId === userId;
}

// ── 5. TENANCY — org scoping applied at the guard, not per-route ──────────────────────────────

/** The session-derived tenancy context every scoped query needs. */
export interface Tenant {
  userId: string;
  orgId: string | null;
  role: Role;
}

/**
 * Build an orgId-scoped `where` for a table that has an `orgId` column. Super Admin is NOT scoped
 * (returns just the extra clause). Every list/detail/mutation query for a tenant role must go
 * through this — it removes the opportunity to forget the orgId filter (the classic leak).
 *
 *   const rows = await db.select().from(ride).where(scopedWhere(tenant, ride, eq(ride.id, id)));
 */
export function scopedWhere(
  tenant: Tenant,
  table: { orgId: unknown },
  extra?: SQL,
): SQL | undefined {
  if (tenant.role === "super_admin") return extra; // cross-tenant: no org filter
  const orgClause = eq(table.orgId as never, tenant.orgId as never);
  return extra ? and(orgClause, extra) : orgClause;
}

// ── 6. THE GUARDS every route calls ──────────────────────────────────────────────────────────

/**
 * Resolve the session, enforce the permission, and return a tenancy-aware session. `platformAccess
 * === 'revoked'` is refused here. The returned `tenant` carries orgId/role for scopedWhere.
 * ALWAYS the first line of a route handler / server action.
 */
export async function requirePermission(resource: Resource, action: Action<typeof resource>) {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();
  const { role, orgId, id } = session.user;

  if (session.user.platformAccess === "revoked") {
    throw new ForbiddenError("Your platform access has been revoked.");
  }
  if (!hasPermission(role as Role, resource, action)) {
    throw new ForbiddenError(`Role "${role}" cannot ${action} ${resource}.`);
  }
  const tenant: Tenant = { userId: id, orgId: orgId ?? null, role: role as Role };
  return { session, tenant };
}

/**
 * The ONE cross-tenant path — super_admin only. Named separately so the tenancy exception is
 * visible in code review rather than an accident. Use for the platform console routes.
 */
export async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();
  if (session.user.role !== "super_admin") {
    throw new ForbiddenError("Platform administration requires the super admin role.");
  }
  return { session, tenant: { userId: session.user.id, orgId: null, role: "super_admin" as Role } };
}

/** Require a minimum role tier (e.g. company_admin console). Refuses revoked access. */
export async function requireRole(min: Role) {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();
  if (session.user.platformAccess === "revoked") {
    throw new ForbiddenError("Your platform access has been revoked.");
  }
  if (!atLeast(session.user.role as Role, min)) {
    throw new ForbiddenError(`This action requires the ${min} role or higher.`);
  }
  return session;
}

/** Just require a signed-in, non-revoked user; returns the session. */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();
  if (session.user.platformAccess === "revoked") {
    throw new ForbiddenError("Your platform access has been revoked.");
  }
  return session;
}
