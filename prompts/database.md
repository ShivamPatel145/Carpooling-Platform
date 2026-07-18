# Database

**When to use this:** adding a new table, or changing a column / enum / index / relation. Anything
under `db/schema/`. Governed by the `drizzle-schema` skill.

```
Add the `{{entity}}` table (or: change `{{entity}}` to <what>). Follow the drizzle-schema skill
and match db/schema/demo-entity.ts exactly — that is the reference table.

RULES (do not deviate):
- ONE file: db/schema/{{entity}}.ts. Never touch db/schema/index.ts — that barrel is the
  integrator's shared file and the PreToolUse hook will block me. If a new table needs exporting,
  say so in one line at the end so I can route it to the integrator; do not edit the barrel.
- Spread `...timestamps` from ./_shared first — every table gets id (uuid defaultRandom),
  createdAt, updatedAt. Add deletedAt ONLY if this entity genuinely needs soft-delete /
  recoverability; default is no soft-delete.
- Ownership: if users own rows, add `ownerId: uuid("owner_id").notNull().references(() => user.id,
  { onDelete: "cascade" })`. The RBAC canEdit/canDelete/canView helpers key off this column.
- Enums are pgEnum, declared IN THIS FILE, above the table. Export the enum and its
  `(typeof x.enumValues)[number]` type.
- Relations: declare `{{entity}}Relations` with relations(...) alongside the table.
- INDEXES — index every foreign key AND every column a list will filter or sort by. The DataTable
  paginates server-side; an unindexed sort is the performance question a reviewer asks. Copy the
  index block shape from demo-entity.ts (ownerIdx, statusIdx, an index on any sorted column, and
  createdAtIdx).
- Zod, colocated at the bottom of this file (see the validation prompt / demo-entity.ts):
  * `{{entity}}SelectSchema` = createSelectSchema(table)
  * `{{entity}}FormSchema`   = the hand-written write schema shared by the API route AND the form
  * `{{entity}}InsertSchema` = createInsertSchema(table).omit({ id, createdAt, updatedAt })
  Export types via z.infer and $inferSelect/$inferInsert.

FIELDS: {{list the columns you need: name/type/nullable/default, and the enum values}}

DO NOT extend the generic tables by copying them. If this entity needs notifications, it inserts
into the existing `notification` table by reference — never create `{{entity}}Notification`. Same
for activity: it goes through the existing `activityLog` via logActivity, not a new audit table.

After writing the file:
1. `pnpm db:generate`, then SHOW ME the generated SQL and stop. Drizzle sometimes infers a DROP
   where I meant a rename — I read the SQL before it runs.
2. Remind me: migrate against MY Neon branch (dev-1..dev-4) with `pnpm db:migrate`, never main.
   main is migrated only at the integration sync point.
3. List anything the integrator must add to db/schema/index.ts.
```

## Notes — check in the output

- **One file, barrel untouched.** If it edited `db/schema/index.ts`, reject — that's the integrator's.
- **`...timestamps` spread**, not hand-written id/timestamp columns. No stray `deletedAt` unless you
  actually asked for soft-delete.
- **Every FK and every filtered/sorted column has an index.** This is the most common miss. Cross-check
  the index block against the fields.
- **Enums are `pgEnum` in this file**, not `text` with a comment, and not declared in another file.
- **Three Zod exports** at the bottom, and the `FormSchema` is the one the API + form will both import.
- **The SQL was shown, not auto-run.** If it silently ran `pnpm db:migrate`, that's a process
  violation — you read migrations before they hit even a dev branch.
