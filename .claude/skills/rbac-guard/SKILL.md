---
name: rbac-guard
description: Enforces this project's resource-action RBAC pattern built on Auth.js. Use whenever creating or modifying ANY API route, server action, page-level access check, permission rule, or role. Trigger this even when the request doesn't mention auth, roles, or permissions — any code that reads or writes domain data needs this skill. Also use when reviewing a diff that touches app/api or any actions.ts.
paths: app/api/**, app/**/actions.ts, lib/permissions.ts, middleware.ts
---

# RBAC Guard

Our RBAC is a resource-action statement pattern adapted from the reference repo, re-implemented on Auth.js. It is a reviewer talking point — "why is your authorization not scattered across the codebase" — so it must be applied consistently or it stops being one.

## The five rules

1. **Every route and server action calls `requirePermission(resource, action)` before touching data.** Never an inline `if (role === 'admin')`. Scattered role checks are the exact thing this pattern exists to eliminate.

2. **New resource/action pairs go in the statement object in `lib/permissions.ts`.** That object is the single source of truth. Per-role permission sets derive from it; `roleHierarchy` orders roles numerically. Adding a role is a new entry, never a new conditional.

3. **Ownership-scoped access uses the `canX(role, ownerId, userId)` helper pattern.** "Only the creator or an approver" is a helper, not an inline expression repeated in six files.

4. **Gate both layers, always.** The UI hides what the user can't do; the API enforces it. Hiding a nav item is not authorization — it's decoration. If you gate only the UI, you have shipped a vulnerability with a friendly face.

5. **Middleware stays Edge-safe.** Session-cookie presence only, redirecting unauthenticated users off protected prefixes. Full role/session validation happens in page/server components. Never import the auth stack into the Edge runtime — it kills cold-start performance and the reviewer will ask.

## Verification — not optional

A route is not done until the **negative case** is tested at the API: the role that should NOT have access is actually refused, with the request made directly rather than through a UI that already hid the button. See the `qa-verify` skill.

## Reference

Full statement object, role table, and hierarchy: [reference.md](reference.md)
