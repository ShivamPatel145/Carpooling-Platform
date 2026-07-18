# Authentication & Authorization

**When to use this:** adding a role, a resource/action, an ownership rule, or gating a route or page.
Auth is Auth.js v5; authorization is a **resource→action statement object** in `lib/permissions.ts` —
the single source of truth. Governed by the `rbac-guard` skill. The rule that matters: **gate both
layers, and the API is the one that counts.**

```
Add / change authorization for {{feature}}. Follow the rbac-guard skill and lib/permissions.ts +
.claude/skills/rbac-guard/reference.md. Authorization lives in ONE file — do not scatter role checks.

TO ADD A RESOURCE OR ACTION (in lib/permissions.ts, the single source of truth):
1. Add it to the `statement` object: `{{entity}}: ["create", "read", "update", "delete", ...]`. This
   object is the whole answer to "how does your RBAC work" — keep it complete.
2. Grant it per role in `roles`. A role that omits a resource has no access to it. Use the `all(...)`
   helper for "everything this resource allows". Existing roles + hierarchy:
     admin (100) · manager (50) · approver (30) · user (10).
3. A NEW ROLE is a new entry in `roles` + `roleHierarchy` + ALL_ROLES — never a new conditional
   anywhere else.

TO GATE AN API ROUTE OR SERVER ACTION:
- `requirePermission("{{entity}}", "<action>")` as the FIRST line, before touching data. It returns
  the session (session.user.id / .role) and throws UnauthorizedError (401) / ForbiddenError (403),
  which withErrorHandler maps to status codes. Never an inline `if (role === 'admin')`.
- For "own record OR someone senior", use the ownership helpers — do not inline the expression:
    canEdit(role, ownerId, userId)   — manager+ OR owner
    canDelete(role, ownerId, userId) — manager+ OR owner
    canView(role, ownerId, userId)   — approver+ OR owner
    canApprove(role, ownerId, userId)— approver+ AND NOT the owner (no self-approval)
- For admin-only pages/actions, `requireRole("admin")`. For "just signed in", `requireAuth()`.

TO GATE THE UI (decoration, not security — but still required):
- Hide actions/nav the role can't use with the pure `hasPermission(role, "{{entity}}", "<action>")`
  (safe on the client) or `atLeast(role, min)`. Nav visibility is driven by minRole in nav.config.ts
  (integrator-owned).
- Gating the UI is NOT authorization. The API MUST enforce independently. A hidden button with an
  open endpoint is a shipped vulnerability.

MIDDLEWARE stays Edge-safe: middleware.ts checks session-cookie PRESENCE only and redirects
unauthenticated users off protected prefixes. Full role/session validation happens in
page/server components via requirePermission/requireRole. Never import the auth stack into middleware.

WHAT TO CHANGE: {{the resource(s), the actions, which roles get what, the ownership rule}}

MANDATORY: give me the RBAC negative test — the endpoint, the method, and the role ({{role}}) that
must receive a 403 when hitting it directly (not via a UI that hid the button). This is the #1
/security-review finding and the #1 thing reviewers probe.
```

## Notes — check in the output

- **One file changed for the rule.** New resources/actions/roles land in `lib/permissions.ts` only. If
  authorization logic appears inline in a route (`if (session.user.role === ...)`), reject — that's the
  exact anti-pattern this pattern exists to kill.
- **Both layers gated.** Confirm the API calls `requirePermission` *and* the UI hides the control. Then
  confirm the API refuses independently of the UI.
- **Ownership via helpers**, not repeated inline expressions. `canApprove` correctly forbids
  self-approval.
- **Middleware didn't grow.** No `auth()` import into `middleware.ts`; cookie-presence check only.
- **A concrete negative test was produced and (ideally) run** — a direct hit that returns 403 for the
  wrong role.
