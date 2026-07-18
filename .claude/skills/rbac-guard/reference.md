# RBAC Reference

## Shape of `lib/permissions.ts`

```ts
// 1. Single source of truth: resource -> allowed actions
export const statement = {
  <resource>: ['create', 'read', 'update', 'delete', 'approve'],
} as const;

// 2. Per-role permission sets, derived from the statement
export const roles = {
  admin:    { <resource>: [...statement.<resource>] },
  approver: { <resource>: ['read', 'approve'] },
  user:     { <resource>: ['create', 'read'] },
} as const;

// 3. Numeric hierarchy — higher wins comparisons
export const roleHierarchy = { admin: 100, approver: 50, user: 10 } as const;

// 4. Ownership helpers — used everywhere instead of inline checks
export function canEdit(role: Role, ownerId: string, userId: string) {
  return roleHierarchy[role] >= roleHierarchy.approver || ownerId === userId;
}

// 5. The guard every route calls
export async function requirePermission(resource: Resource, action: Action) {
  const session = await auth();
  if (!session) throw new UnauthorizedError();
  if (!roles[session.user.role]?.[resource]?.includes(action)) throw new ForbiddenError();
  return session;
}
```

## Route template

```ts
export async function POST(req: Request) {
  const session = await requirePermission('<resource>', 'create');   // ALWAYS first
  const body = <resource>InsertSchema.parse(await req.json());       // Zod, shared with the form
  const row = await db.insert(<resource>).values({ ...body, ownerId: session.user.id }).returning();
  await logActivity({ actor: session.user.id, action: 'create', resource: '<resource>', resourceId: row[0].id });
  return Response.json(row[0]);
}
```

## Role table — fill at 9:30 tomorrow

| Role | Hierarchy | Owns | Typical actions |
|---|---|---|---|
| admin | 100 | everything | full CRUD, settings, user management |
| approver | 50 | review queue | read, approve, reject |
| _business role_ | 30 | own records | create, read, update own |
| _external role_ | 10 | own requests | create, read own |

## Common mistakes

- Gating the nav item but not the route → the URL still works. This is the #1 finding in `/security-review`.
- Checking `session.user.role` inline "just this once" → it never is just once.
- Forgetting `logActivity` on a mutating route → the audit trail has holes and the reviewer finds them.
- Importing `auth()` into middleware → Edge runtime bloat.

---

## Carpooling tenancy (the load-bearing section — read before any route)

Domain confirmed: multi-tenant Enterprise Carpooling. Roles and tenancy below supersede the
generic placeholder table above.

## The three roles

| Role | Hierarchy | Scope | Does |
|---|---|---|---|
| `super_admin` | 100 | **cross-tenant** (the one exception) | creates orgs, invites company admins, views platform-wide metrics. Never books/offers a ride, never touches an individual employee. |
| `company_admin` | 50 | own `orgId` only | employee mgmt (approve/deactivate, revoke platform access), vehicle approval, org + cost settings, participation. No ride operations. |
| `employee` | 10 | own `orgId` + own records | offer/find/book rides, vehicles, trips, tracking, chat, wallet/payments, history, saved places. Mode-switcher: same account drives and rides. |

## The `orgId` scoping rule (enforce at the guard, never per-route)

Every domain table has a non-null `orgId`, set once at join time, immutable. For every
non-super-admin role, **every query is filtered by `session.user.orgId`** — enforced in the
permissions layer, not remembered per route. A route that forgets is the classic tenancy leak, so
remove the opportunity to forget:

- `requirePermission(resource, action)` resolves `session.user.orgId` and returns it; callers scope
  their query with it (`eq(table.orgId, session.user.orgId)` alongside the row filter).
- A helper (e.g. `scopedWhere(session, table, extra?)`) builds the `orgId`-scoped `where` so slices
  don't hand-roll it. Use it in every list/detail/mutation query.
- **`super_admin` uses a separate, explicitly-named path — `requireSuperAdmin()`** — for the
  cross-tenant surface. The exception is visible in code review, not an accident.
- `platformAccess === 'revoked'` blocks at the guard (treated like no access), even for an
  otherwise-valid employee.

## The 404-not-403 rule (cross-org)

A `company_admin` or `employee` requesting a row that belongs to **another org** by id gets
**404, not 403**. We don't admit the record exists. Concretely: fetch scoped by `orgId`; if the
scoped fetch returns nothing, throw `NotFoundError` — never fetch unscoped and then compare orgs
(that leaks existence via 403). Same for cross-org mutations.

## The four MANDATORY RBAC negative tests (QA runs all four, at the API)

Hit the endpoint directly (not through a UI that hid the button). Each must be refused:

1. **Cross-org read → 404.** Org A admin GETs an Org B `ride`/`booking`/`vehicle` by id → 404.
2. **Cross-org mutation → 404.** Org A admin PATCHes/DELETEs an Org B row by id → 404.
3. **Role escalation → 403.** An `employee` calls a `company_admin`-only route (approve a vehicle,
   revoke access, edit org settings) → 403. A `company_admin` calls a `super_admin` route (create
   org, list all orgs) → 403.
4. **Revoked access → 403/redirect.** A user with `platformAccess === 'revoked'` calls any
   protected route → refused at the guard.

Plus the ownership negatives from the base skill (a user editing another user's own-scoped record
inside the same org → 403 via `canEdit`).

## Statement additions (build-day)

Add to the `statement` object: `organization`, `invitation`, `vehicle`, `savedPlace`, `ride`,
`booking`, `trip`, `message`, `payment`, `wallet`, `report`. Derive per-role sets:
- `super_admin`: `organization` (create/read/update/delete), `invitation` (create/read), platform
  `report` (read) — and nothing that operates a ride.
- `company_admin`: `user`/`vehicle`/`invitation` management, `organization` (read/update own),
  `report` (read/export), `activityLog` (read). No offer/find/book.
- `employee`: `ride`/`booking`/`vehicle`/`savedPlace`/`trip`/`message`/`payment`/`wallet`
  (create/read + own-scoped update/delete), `report` (read own). Ownership helpers scope to own rows.
