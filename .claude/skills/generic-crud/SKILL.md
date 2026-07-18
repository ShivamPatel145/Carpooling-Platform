---
name: generic-crud
description: How to wire a new entity into this project's pre-built CRUD, DataTable, and form primitives. Use whenever building list, create, edit, delete, or detail screens for ANY entity — including when the request is phrased as "a page to manage X", "let users add Y", or "show all the Zs". Also use when a screen needs loading, empty, or error states.
paths: features/**
---

# Generic CRUD

The primitives were built in Phase 0 specifically so tomorrow is assembly, not construction. Hand-rolling a list screen means throwing away the prep.

## Start by copying

`features/_demo/` is a working, tested reference implementation of the full pattern. Copy it. Rename. Don't start from a blank file and don't reinvent a shape that already works.

```
features/<entity>/
├── columns.tsx      # DataTable column defs
├── schema.ts        # Zod, derived from the Drizzle table, shared with the API
├── hooks.ts         # TanStack Query hooks + mutations
├── form.tsx         # RHF + zodResolver
└── components/      # anything entity-specific
```

## The five rules

1. **Never hand-roll a list screen.** `<DataTable>` + the entity's column def. Search, column filters, and pagination come free and already work. A bespoke table is a bespoke bug.

2. **One Zod schema, two consumers.** `features/<entity>/schema.ts` is imported by the API route *and* the form. Never two copies — they drift, and the drift shows up as validation passing on the client and failing on the server at hour 14.

3. **Mutations go through TanStack Query hooks** in `hooks.ts`, invalidating the entity's list query key on success. Manual refetches leave stale UI that reviewers notice immediately.

4. **Every screen ships with all five states** from the shared primitives: loading skeleton, empty, error, success toast, status badge. No exceptions — this is the §7 quality bar and it's what separates "real SaaS tool" from "hackathon prototype" at a glance. An empty state is not a blank div.

5. **New entity = purely additive.** New `features/<entity>/` + new `db/schema/<entity>.ts` + new `app/api/<entity>/` + one `nav.config.ts` entry. Zero edits to existing feature code. If you find yourself editing another slice's files, stop — you've found a seam that needs an owner.

## API shape — fixed

`app/api/<resource>/` with `[id]/`, `create/`, `my/`, `stats/`. One folder per resource. Every handler opens with `requirePermission` (see `rbac-guard`) and closes with `logActivity` if it mutates.

## Before calling it done

`qa-verify` skill. Minimum: create + read + update + delete through the real UI, one edge case, the RBAC negative case at the API, 375px, and every one of the five states actually rendering.
