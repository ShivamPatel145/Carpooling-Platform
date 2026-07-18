# APIs

**When to use this:** building the API route set for a resource. The shape is **fixed** — same folders,
same guard, same wrapper, same audit call every time. That consistency is a reviewer talking point;
deviating from it quietly removes the point.

```
Build the API routes for `{{entity}}`. The shape is FIXED — copy app/api/demo-entity/ exactly and
adapt. Resource path is the plural/kebab of {{entity}} (e.g. purchaseOrder → app/api/purchase-order/).

FOLDERS (one resource = these files):
  app/api/<resource>/route.ts            GET list + POST create
  app/api/<resource>/[id]/route.ts       GET one + PATCH update + DELETE
  app/api/<resource>/my/route.ts         GET only the current user's rows
  app/api/<resource>/stats/route.ts      GET aggregate counts for dashboards (see analytics prompt)

EVERY handler, no exceptions:
1. Is wrapped in `withErrorHandler` from @/lib/api. Never a bare export.
2. OPENS with `requirePermission("{{entity}}", "<action>")` from @/lib/permissions — the FIRST line,
   before touching the db. Read → "read", POST → "create", PATCH → "update", DELETE → "delete".
   requirePermission returns the session; use session.user.id / session.user.role.
3. Validates the body with the SHARED schema: `{{entity}}FormSchema.parse(await req.json())`
   (imported from features/{{entity}}/schema.ts — the same object the form uses). Do not re-catch
   ZodError; withErrorHandler turns it into a 400 with field issues.
4. If it MUTATES (POST/PATCH/DELETE), CLOSES with `logActivity({ actorId: session.user.id, action,
   resource: "{{entity}}", resourceId, req })` after the write succeeds. A missing logActivity is a
   hole in the audit trail and reviewers probe for it.
5. Returns via the helpers: `ok(data)` (200), `created(row)` (201), `noContent()` (204). Errors are
   thrown as typed errors from @/lib/errors (NotFoundError, ForbiddenError) — never a hand-built
   Response with a status code.

OWNERSHIP on [id] PATCH/DELETE (the RBAC negative-test surface):
  const existing = await db.query.{{entity}}.findFirst({ where: eq({{entity}}.id, id) });
  if (!existing) throw new NotFoundError("That item doesn't exist.");
  if (!canEdit(session.user.role, existing.ownerId, session.user.id))
    throw new ForbiddenError("You can only edit your own items.");
  // ...then update. Use canDelete for DELETE.
This means a plain {{role}} who is NOT the owner is refused HERE, at the API, even if the UI hid the
button. That refusal is the mandatory RBAC negative test.

PATTERNS TO COPY:
- List ordering: `.orderBy(desc({{entity}}.createdAt))`.
- `my`: `.where(eq({{entity}}.ownerId, session.user.id))`.
- Params in Next 15 are async: `type Ctx = { params: Promise<{ id: string }> }` then
  `const { id } = await params;` — copy from app/api/demo-entity/[id]/route.ts.
- Convert "" → null on optional text before insert: `values.description || null`.

ENTITY SPECIFICS: {{any non-CRUD action this resource needs — e.g. an approve endpoint. If so, add
"approve" to the statement in lib/permissions.ts first (see the authentication prompt) and gate it
with requirePermission("{{entity}}", "approve"); use the canApprove helper (no self-approval).}}

After building: give me the exact curl (or fetch) for the RBAC negative test — the endpoint, the
method, and which role should get a 403.
```

## Notes — check in the output

- **All four folders present** (`route.ts`, `[id]/`, `my/`, `stats/`). A resource missing `stats` or
  `my` isn't following the fixed shape even if CRUD works.
- **`requirePermission` is line one** of every handler and **`withErrorHandler` wraps every export.**
  A GET without a permission check is an authorization hole.
- **Every mutation ends with `logActivity`.** POST, PATCH, and DELETE — grep the diff for it.
- **Ownership is checked with `canEdit` / `canDelete`**, not an inline `role === 'admin'`. The
  `NotFoundError` comes before the `ForbiddenError` (don't leak existence... but here we 404 first by
  design — match `_demo`).
- **No hand-built `Response(..., { status })`.** Success via `ok`/`created`/`noContent`; failure via
  thrown typed errors.
- **Async `params`.** Next 15 — `await params`. A synchronous `params.id` won't compile.
- **You were handed a runnable RBAC negative test.** If not, the route isn't verifiable yet.
