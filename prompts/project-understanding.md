# Project Understanding

**When to use this:** the first prompt of a session, before Claude writes anything. Gets it oriented in
*this* repo — the stack, the conventions, and the pre-built assets — so it adapts what exists instead
of scaffolding a parallel version.

```
Orient yourself in this repo before writing any code. This is a Phase-0-complete Next.js 15 hackathon
scaffold — everything below already exists, is tested, and is deployed green on Vercel. Your job today
is ADAPT, never re-scaffold, re-install, or rebuild.

Read, in order, and then summarize back to me:
1. CLAUDE.md — the chosen domain, schema, roles, ownership map, and project-specific conventions.
2. docs/overview.md and docs/design-standards.md.
3. .claude/skills/ — every SKILL.md. These have active triggers; respect them. The load-bearing
   ones: design-standards (visual law), drizzle-schema (any db change), generic-crud (any list/
   form/detail screen), rbac-guard (any route or access check), reviewer-doc, qa-verify.
4. The reference implementations you will COPY rather than invent:
   - features/_demo/           — the full CRUD slice template
   - db/schema/demo-entity.ts  — the reference table (+ colocated Zod)
   - app/api/demo-entity/      — the fixed API shape ([id]/, my/, stats/, create in route.ts POST)
   - lib/permissions.ts        — the RBAC statement object (single source of truth)

THE STACK (locked, do not swap): Next.js 15 App Router · React 18 · TypeScript strict · Tailwind v3 +
shadcn/ui · Framer Motion · React Hook Form + Zod · TanStack Query · Drizzle + Neon · Auth.js v5 +
custom RBAC (lib/permissions.ts) · UploadThing · Resend + React Email · @react-pdf/renderer · pnpm ·
Vercel.

THE CONVENTIONS THAT MATTER (you'll be held to these):
- Copy features/_demo/ for CRUD; never hand-roll a list screen — use <DataTable>.
- ONE Zod schema per entity in features/<entity>/schema.ts (re-exported from the db table), shared
  by BOTH the API route and the form.
- Fixed API shape per resource: app/api/<resource>/ with [id]/, create (route.ts POST), my/, stats/.
  Every handler opens with requirePermission and mutations close with logActivity, wrapped in
  withErrorHandler.
- One file per table under db/schema/; every table gets id/createdAt/updatedAt; index every FK and
  filtered/sorted column; enums as pgEnum in the table's file. db/schema/index.ts is the integrator's
  shared file — don't edit it.
- RBAC via the statement object in lib/permissions.ts; gate BOTH API and UI; ownership via
  canEdit/canDelete; the RBAC negative test at the API is mandatory.
- The five data states on every screen (loading/empty/error/success/status) from @/components/states.
- Design law in docs/design-standards.md: hard bans (no purple/violet, no gradients, no fabricated
  stats); locked type (Space Grotesk / IBM Plex Sans / IBM Plex Mono); one swappable accent token.
- Notifications through the generic `notification` table + lib/email.ts (Resend) — never per-feature.

Then tell me back, concisely:
  (a) the domain and the roles, from CLAUDE.md;
  (b) which pre-built assets my task ({{feature}}) will reuse, and what (if anything) is genuinely NEW;
  (c) the single riskiest assumption you'd want confirmed before building.
Do not start building yet — just confirm you're oriented.
```

## Notes — check in the output

- The summary should name the **actual domain and roles from CLAUDE.md**, not the generic scaffold
  defaults. If it parrots "demoEntity / admin·manager·approver·user" only, it didn't read CLAUDE.md.
- It should map your `{{feature}}` onto **existing assets** and keep the NEW list short. A long NEW list
  usually means it's about to rebuild something that exists.
- It should NOT propose swapping any library or re-running the scaffold.
- Good sign: it flags one concrete assumption to confirm rather than diving straight in.
