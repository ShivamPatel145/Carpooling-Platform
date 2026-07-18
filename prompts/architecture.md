# Architecture

**When to use this:** deciding *where* a feature lives and *how* it stays additive — before writing it.
The whole scaffold is built around an **extensibility contract**: new features drop in without a
redesign. Breaking it at hour 18 is a rewrite, so name the contract and honor it from the first commit.

```
Plan the architecture for {{feature}} before building. Do NOT write feature code yet — produce a plan
that fits this repo's extensibility contract, then wait for my go-ahead.

THE EXTENSIBILITY CONTRACT (from docs/architecture.md — honor all five):
1. NEW ENTITY = purely additive. features/<entity>/ + db/schema/<entity>.ts + app/api/<resource>/ +
   ONE nav.config.ts entry. ZERO edits to existing feature code. If the plan requires editing another
   slice's files, that's a cross-slice seam — name it and assign it to ONE slice.
2. CONFIG-DRIVEN SECTIONS. nav.config.ts, dashboard.config.ts, homepage.config.ts are arrays. Adding
   a nav item / widget / section is a DATA change, not a layout rewrite. Build new surfaces this way.
3. ROLES / PERMISSIONS extend via the statement object in lib/permissions.ts only. A new role is an
   entry, never a new conditional.
4. CROSS-CUTTING CONCERNS go through the existing utilities, never reimplemented per feature:
   notifications → the `notification` table + lib/email.ts · activity → logActivity · uploads →
   UploadThing (lib/uploadthing.ts) · PDF → lib/pdf · email → lib/email.ts (Resend).
5. API SHAPE is fixed: app/api/<resource>/ with [id]/, create (route.ts POST), my/, stats/.

SHARED FILES ARE THE INTEGRATOR'S (the PreToolUse hook enforces it): db/schema/index.ts, the root
layout, and nav/dashboard/homepage configs. My plan LISTS the changes these need so the integrator
applies them at a sync point — the plan never edits them directly.

PRODUCE:
- The entities this feature owns and which slice owns each (map to docs/team-ownership.md if it
  exists). Every requirement traces to exactly ONE slice.
- The file tree it adds: db/schema/*, features/<entity>/*, app/api/<resource>/*, pages/routes.
- Every CROSS-SLICE SEAM (approval chains, anything spanning two slices) with its single owner named.
  Unowned seams are how integration fails.
- Which cross-cutting utilities it uses (from contract #4) and how.
- The permission changes for lib/permissions.ts (resources, actions, per-role grants).
- A one-line note for each shared-file change the integrator must make.
- Any point where a build decision would VIOLATE a contract item — escalate it here, before building.

CONTEXT: {{what the feature does, which roles touch it, what it connects to}}

Keep it to what unblocks the build. This is a plan to start from, not a finished design.
```

## Notes — check in the output

- **Additive-only** file tree: new folders under `features/`, `db/schema/`, `app/api/`. If the plan
  edits an existing slice's feature code, that's a seam — it must be named and owned, not smuggled in.
- **Cross-cutting concerns route to the existing utilities.** A plan that proposes a per-feature mailer,
  a bespoke audit table, or a second notification system violates contract #4 — reject.
- **Shared files are listed, not edited.** The plan should hand the integrator a short list (barrel
  export, nav entry) rather than modifying `db/schema/index.ts` or the configs itself.
- **Every seam has exactly one owner.** An approval chain that spans two slices with no named owner is
  the classic integration failure.
- **New surfaces are config-driven** (array entries), not new bespoke layouts.
