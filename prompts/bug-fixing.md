# Bug Fixing

**When to use this:** a defect is reported and you need it diagnosed and fixed without regressing the
pattern or papering over the root cause. Reproduce first; fix the cause, not the symptom; verify in the
running app.

```
Diagnose and fix this bug in {{feature}} / `{{entity}}`. Find the ROOT CAUSE — do not patch the
symptom, and do not change the shared conventions to route around it.

BUG: {{what happens, what you expected, exact error / console output / screenshot, and the steps to
reproduce}}

PROCESS:
1. REPRODUCE first. State the exact steps and confirm you can trigger it. If you can't reproduce it,
   say so and tell me what you need — don't guess-fix.
2. LOCATE the root cause. Read the actual code path before changing anything. This stack has known
   failure points worth checking against the symptom:
   - Validation passes on the client but fails on the server → the form and the API are NOT sharing the
     ONE Zod schema (features/{{entity}}/schema.ts). This is the canonical drift bug.
   - 401/403 where you expected success → the permission/action isn't granted to the role in
     lib/permissions.ts, or an ownership helper (canEdit/canDelete) is refusing. Check the statement +
     roles, not the route body.
   - Stale list after create/edit/delete → the mutation isn't invalidating the entity's query key in
     hooks.ts (or a manual refetch was used instead of TanStack Query).
   - "params" errors in a route → Next 15 params are async; must be `await params`.
   - Number/date field rejected → schema needs z.coerce (form values arrive as strings).
   - Empty text saved as "" instead of null → the route must convert `values.field || null`.
   - Missing audit row → the mutation didn't call logActivity.
   - DB connection exhaustion under load → not using the pooled (-pooler) Neon host.
3. FIX at the cause. The fix should make the code MORE consistent with the reference
   (features/_demo/, app/api/demo-entity/, lib/permissions.ts), not less. If the "fix" would fork a
   convention (a second schema, an inline role check, a bespoke table), stop — that's a smell, escalate
   instead.
4. VERIFY: reproduce the ORIGINAL steps and confirm it's gone, in the running app (/verify or /run),
   not just a passing typecheck. Then run the happy path around it to confirm no regression, and — if
   the bug touched auth/RBAC/uploads/data — the RBAC negative test.
5. Note the root cause in one line (for docs/decisions.md if it was a design issue).

Keep the diff minimal and targeted. Don't refactor unrelated code in a bug fix — that's a separate
pass (see the refactoring prompt).
```

## Notes — check in the output

- **Reproduced before fixed.** A fix with no reproduction is a guess. If it couldn't reproduce, it
  should have said so.
- **Root cause, not symptom.** The change addresses *why* it broke. A `try/catch` that swallows the
  error, a hardcoded value, or a UI-only patch over an API bug is symptom-masking — reject.
- **Fix moves toward the convention.** It should look more like `_demo`/`permissions.ts`, not fork a new
  pattern. If it introduced a second Zod schema or an inline role check to "fix" something, that's a new
  bug.
- **Verified in the running app** against the original repro, plus a regression pass on the happy path
  (and the RBAC negative test if auth/data was involved).
- **Minimal diff.** No unrelated refactoring smuggled into the fix.
