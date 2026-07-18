# Refactoring

**When to use this:** cleaning up drift, duplication, or a hand-rolled version of something the scaffold
already provides — *without* changing behavior. In this repo, "refactor" usually means **pull the code
back onto the reference pattern**: the shared schema, the generic primitives, the fixed API shape, the
one RBAC file.

```
Refactor {{feature}} / `{{entity}}` for consistency with this repo's patterns, WITHOUT changing
behavior. The goal is to remove drift and duplication and converge on the reference implementations —
not to redesign. Behavior before and after must be identical; verify that.

CONVERGENCE TARGETS — look specifically for and fix these:
- TWO Zod schemas describing the same entity → collapse to the ONE shared schema in
  features/{{entity}}/schema.ts (re-exported from the db table), imported by both the form and the API.
  This is the highest-value refactor — drift here is a live bug waiting to happen.
- A hand-rolled list/table → replace with <DataTable> + a ColumnDef[] (columns.tsx). Search, filters,
  and pagination come free; a bespoke table is a bespoke bug.
- Hand-wired form <input>s → the field primitives in @/components/form.
- Inline `if (role === 'admin')` or any scattered role check → requirePermission / hasPermission and
  the canEdit/canDelete/canView/canApprove helpers. Authorization belongs in lib/permissions.ts.
- A route that isn't wrapped in withErrorHandler, doesn't open with requirePermission, or hand-builds a
  Response with a status code → bring it onto the fixed shape (ok/created/noContent + typed errors).
- A mutation missing logActivity, or missing query-key invalidation in hooks.ts.
- A per-feature notification path / mailer / audit table → route through the generic notification
  table, lib/email.ts, and logActivity.
- Ad-hoc colours, spacing, or fonts → the design tokens (accent token, the spacing scale, the locked
  type trio). Hardcoded hexes and pixel values converge on lib/design-tokens.ts.
- Missing states → add the five from @/components/states.

RULES:
- Behavior-preserving only. No new features, no new endpoints, no schema changes disguised as cleanup.
  If a real behavior change is warranted, call it out separately — don't fold it in.
- Stay in your slice's files. Do NOT edit shared files (db/schema/index.ts, nav/dashboard/homepage
  configs, root layout) — flag those for the integrator.
- Keep the diff reviewable: prefer several small, obvious moves over one sweeping rewrite.
- After: pnpm typecheck && pnpm lint && pnpm build clean, then /verify — confirm the behavior is
  unchanged by exercising the same flow. A refactor that changes what the screen does isn't a refactor.

SCOPE: {{which files/area to clean up, and the specific drift you've noticed if any}}
```

## Notes — check in the output

- **Behavior is identical.** The same flow produces the same result before and after. If outputs
  changed, it wasn't a refactor — it was an unreviewed feature change.
- **It converged, not diverged.** The result should look *more* like `_demo` / `permissions.ts` / the
  primitives. Watch for the opposite: a "cleanup" that invents a new abstraction.
- **The big one: schema de-duplication.** If there were two Zod schemas, there's now one, shared.
- **No shared files edited.** Barrel/config/layout changes are flagged for the integrator, not made.
- **Small, reviewable diff**, and `pnpm build` + `/verify` confirm unchanged behavior.
