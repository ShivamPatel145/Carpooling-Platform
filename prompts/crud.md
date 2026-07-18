# CRUD

**When to use this:** standing up a full slice for an entity — list, create, edit, delete, detail.
This is the highest-traffic prompt on build day. The move is **copy `features/_demo/`, rename, adapt**
— never hand-roll a list screen. The primitives were built in Phase 0 so this is assembly, not
construction.

```
Build the full CRUD slice for `{{entity}}` by COPYING features/_demo/ and app/api/demo-entity/ and
renaming. Do not start from blank files and do not reinvent shapes that already work. Follow the
generic-crud, drizzle-schema, and rbac-guard skills.

This slice is PURELY ADDITIVE — new files only. If I find myself editing another slice's feature
code, stop: that's a seam that needs an owner. The only shared files involved are the schema barrel
and nav.config.ts, which the INTEGRATOR edits — I flag those, I don't touch them.

STEP 1 — SCHEMA (db/schema/{{entity}}.ts)
  Copy db/schema/demo-entity.ts. Keep `...timestamps` and the ownerId FK. Set my real fields and
  enum. Index every FK and every column the list filters/sorts by. Colocate the three Zod schemas
  (Select / Form / Insert). `pnpm db:generate`, show me the SQL, then migrate MY Neon branch (never
  main). (See the database + validation prompts for detail.)

STEP 2 — API (app/api/<resource>/  — resource is the kebab plural of {{entity}})
  Copy all of app/api/demo-entity/: route.ts (GET list + POST), [id]/route.ts (GET/PATCH/DELETE with
  canEdit/canDelete ownership), my/route.ts, stats/route.ts. Every handler: requirePermission first,
  withErrorHandler wrapper, {{entity}}FormSchema.parse for the body, logActivity on every mutation.
  (See the apis prompt.)

STEP 3 — FEATURE FOLDER (features/{{entity}}/) — copy features/_demo/ file-for-file:
  - schema.ts   → re-export the db schema + the enum→options helper (do NOT redefine the schema).
  - columns.tsx → DataTable ColumnDef[]. IDs and numbers use `font-mono tabular-nums` (design §3).
                  The status column gets a StatusBadge cell + a filterFn for the faceted filter.
  - hooks.ts    → TanStack Query hooks. Query key ["{{entity}}", ...]. Every mutation invalidates
                  the entity key on success AND fires a success toast (that's one of the five
                  states). Copy the useCreate/useUpdate/useDelete/useList/useMy/useStats shape.
  - form.tsx    → RHF + zodResolver({{entity}}FormSchema) — the SHARED schema. Compose the field
                  primitives from @/components/form (TextField/SelectField/DateField/SwitchField/
                  FileField). Do not hand-wire inputs.
  - components/ → list, create-dialog, row-actions — copy and rename.
  - index.ts    → re-export the public surface.

STEP 4 — PAGES (app/(dashboard)/... or the role's route group)
  - list page: render <DataTable> with the entity's columns, wired to the list hook. Pass
    isLoading / isError / onRetry, searchColumn, and a `facets` entry for status. NEVER hand-build a
    <table> — search, column filters, and pagination come free from <DataTable>.
  - detail/edit page: copy app/(dashboard)/demo/[id]/page.tsx.

STEP 5 — THE FIVE STATES on every screen, from @/components/states:
  loading skeleton (TableSkeleton/FormSkeleton) · empty (EmptyState — an empty state is NOT a blank
  div; give it a title, description, and a create action) · error (ErrorState with onRetry) ·
  success (toast from the mutation hooks) · status badge (StatusBadge). <DataTable> already renders
  loading/empty/error for the list — wire the props; the others are on me.

FLAG FOR THE INTEGRATOR (do not edit these yourself):
  - db/schema/index.ts export for the new table.
  - one nav.config.ts entry: { title, href, icon, minRole, group }.

FIELDS / ENUM / ROLE MODEL: {{describe the entity's fields, its status enum, and who can do what —
which role creates, who approves, whether non-owners can edit}}

BEFORE CALLING IT DONE — run the qa-verify checklist (see the testing prompt): create + read +
update + delete through the real UI, one edge case, the RBAC negative test at the API (a {{role}}
who shouldn't have access gets a 403), 375px, and every one of the five states actually rendering.
```

## Notes — check in the output

- **It copied `_demo`; it didn't invent.** The five feature files exist with the same responsibilities.
  If `columns.tsx` or `hooks.ts` looks nothing like the reference, it was hand-rolled.
- **`<DataTable>` renders the list** — no bespoke `<table>`, `<thead>`, or manual pagination anywhere.
  The list page passes `columns`, `data`, `isLoading`, `isError`, `onRetry`, `searchColumn`, `facets`.
- **One Zod schema.** The form's `zodResolver` and the route's `.parse` reference the same
  `{{entity}}FormSchema`. (This is the #1 thing to eyeball.)
- **Mutations invalidate the query key and toast.** Otherwise the list shows stale data after a create —
  a thing reviewers notice instantly.
- **All five states are real.** The empty state has copy and an action; the loading state is a skeleton,
  not a spinner-on-blank; errors offer retry; success toasts fire; statuses render as badges.
- **Additive only.** The diff touches new `features/{{entity}}/`, new `db/schema/{{entity}}.ts`, new
  `app/api/<resource>/`, new pages — plus *flagged* (not edited) barrel + nav entries. Edits to another
  slice's files mean a seam was crossed.
- **RBAC gated at API and UI**, and the negative test was actually run at the API, not just "the button
  is hidden."
