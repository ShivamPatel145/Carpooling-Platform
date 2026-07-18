# CLAUDE.md

Facts and conventions for this repo. Procedures live in `.claude/skills/` (they auto-load on
trigger). Design law lives in `docs/design-standards.md` — **do not inline it here**; this file
loads every turn across four sessions.

> ⚠️ This is a shared file. Only the **integrator** edits it, at a sync point. The `PreToolUse`
> hook blocks everyone else. Need a change? Route it through the integrator at :50.

---

## Project

Odoo × KSV Hackathon final-round build. **Enterprise Carpooling Platform** — a multi-tenant web
app where employees of a registered organization discover and share rides along common commutes.
Full spec: `docs/PRD.md`. Screen map: `docs/wireframe-map.md`. Ownership: `docs/team-ownership.md`.

- **Domain:** Enterprise carpooling (multi-tenant). Employee is a *mode-switcher* — the same
  account offers a ride (driver) and finds a ride (passenger).
- **Value proposition:** "Ride Together, Save Together." — cut commute cost and congestion by
  matching colleagues on overlapping routes, with live tracking, chat, and wallet payments.
- **Roles (three):** `super_admin` (platform operator, cross-tenant), `company_admin` (one per org,
  configuration only), `employee` (the primary user). Hierarchy 100/50/10 in `lib/permissions.ts`.
- **Tenancy is load-bearing:** every domain table has a non-null `orgId` (except `organization`).
  Non-super-admin queries are `orgId`-scoped via `scopedWhere(tenant, table, …)`; cross-org access
  returns **404, not 403**; `requireSuperAdmin()` is the one audited exception. See `rbac-guard`.
- **Integrations (build-day keys):** Pusher (live tracking/chat), Stripe test (payments/wallet),
  OSRM+Leaflet (routing/maps, no key). Google/Resend/UploadThing already configured.

---

## Stack (LOCKED — do not substitute)

Next.js 15 (App Router) · React 18 · TypeScript (strict) · Tailwind v3 · shadcn/ui · Framer Motion ·
React Hook Form + Zod · TanStack Query · PostgreSQL on Neon · Drizzle ORM + drizzle-kit ·
Auth.js (next-auth v5) + custom RBAC · UploadThing · Resend + React Email · @react-pdf/renderer ·
pnpm · Vercel.

Deliberately rejected (have the one-line reason ready for reviewers): Prisma, Better-Auth's
access-control plugin, SWR, Docker/Redis/Elasticsearch, external observability. We took the
reference repo's *patterns*, not its libraries.

## Commands

```bash
pnpm dev          # dev server (localhost:3000)
pnpm build        # production build
pnpm start        # serve the build
pnpm lint         # eslint (next lint)
pnpm typecheck    # tsc --noEmit  — strict, must be clean before any handoff
pnpm db:generate  # generate SQL migration from db/schema (READ the SQL before applying)
pnpm db:migrate   # apply migrations to DATABASE_URL (your Neon branch, never main from a feature session)
pnpm db:studio    # drizzle-kit studio (visual DB browser)
pnpm db:seed      # seed demo users (every role) + demo data. Idempotent.
pnpm email        # react-email preview server (emails/) on :3001
```

Demo logins after `pnpm db:seed` (password `Password123!` for all): `admin@demo.dev`,
`manager@demo.dev`, `approver@demo.dev`, `user@demo.dev`.

---

## Folder conventions

Import alias: **`@/*` → repo root** (e.g. `@/lib/permissions`, `@/components/ui/button`, `@/db`).

```
app/                    App Router. Route groups: (auth) public auth, (dashboard) protected shell.
  api/<resource>/       route.ts (list+create) · [id]/ (get/update/delete) · my/ · stats/
components/
  ui/                   shadcn primitives
  states/               the FIVE data states: loading / empty / error / success(toast) / status-badge
  form/                 reusable RHF field primitives (TextField, SelectField, DateField, …)
  data-table/           the generic <DataTable> (search + filter + pagination)
  shell/                dashboard chrome (sidebar, top nav, user menu)
features/<entity>/      one folder per slice. schema.ts · hooks.ts · columns.tsx · form.tsx · components/
  _demo/                THE working CRUD reference — copy it for a real entity
db/schema/<table>.ts    ONE file per table, re-exported from db/schema/index.ts (barrel)
lib/                    permissions, auth, api wrapper, errors, logger, email, pdf, fetcher, utils
emails/                 React Email templates (notification-email.tsx = the one to duplicate)
prompts/                reusable Claude prompt library
docs/                   architecture, database, api, decisions (ADR), design-standards, …
.claude/skills/         procedures (auto-load on trigger)
```

## Database

- **One file per table** under `db/schema/`. Never one big schema file — parallel devs must not
  touch the same line. Barrel `db/schema/index.ts` is integrator-only.
- Every table: `id` (uuid, defaultRandom), `createdAt`, `updatedAt` (spread `...timestamps` from
  `db/schema/_shared.ts`). Add `deletedAt` only where recoverability is genuinely needed.
- Index every FK and every column a list filters or sorts by. Enums as `pgEnum` in the table's file.
- Extend the generic tables (`notification`, `activityLog`, `supportTicket`, …) **by reference** —
  never duplicate their purpose per feature.
- Neon **pooled** connection string always. Each dev migrates their own branch (`dev-1..dev-4`).
- Full conventions: `drizzle-schema` skill.

## RBAC (the reviewer talking point)

- Single source of truth: the `statement` object in `lib/permissions.ts` (resource → actions).
  Per-role sets derive from it; `roleHierarchy` orders roles numerically.
- **Every** API route/server action opens with `requirePermission(resource, action)`. Never an
  inline `if (role === 'admin')`. Adding a role = a new entry, not a conditional.
- Ownership-scoped access: `canEdit / canDelete / canView / canApprove(role, ownerId, userId)`.
- Gate **both** layers: UI hides, API enforces. A hidden nav item is not authorization.
- Middleware is **edge-safe** — cookie presence only. Full validation in server components via
  `lib/session.ts` (`requireSession`, `requireRolePage`, `requirePermissionPage`). Never import the
  auth stack into the Edge runtime.
- Full conventions: `rbac-guard` skill.

## CRUD & forms

- **Copy `features/_demo/`.** Never hand-roll a list screen — use `<DataTable>` + a column def.
- **ONE Zod schema per entity** in `features/<entity>/schema.ts`, re-exported from the db table,
  imported by BOTH the API route and the form. Never two copies.
- Mutations go through TanStack Query hooks in `hooks.ts`, invalidating the entity's list key on
  success and firing a success toast.
- New entity = purely additive: `features/<entity>/` + `db/schema/<entity>.ts` +
  `app/api/<entity>/` + ONE `nav.config.ts` entry. Zero edits to existing feature code.
- API handlers wrap in `withErrorHandler` (`lib/api.ts`); mutations close with `logActivity`.
- Full conventions: `generic-crud` skill.

## Config-driven surfaces (extensibility contract)

`nav.config.ts`, `dashboard.config.ts`, `homepage.config.ts` are arrays. Adding a nav item, widget,
or homepage section is a **data change**, not a layout rewrite. All three are integrator-only shared
files.

## Design

Read `docs/design-standards.md` before any UI. Type system is **LOCKED**: Space Grotesk (display) ·
IBM Plex Sans (body) · IBM Plex Mono (data). Tokens in `lib/design-tokens.ts`. The **accent** is the
only colour that changes — one token, one line, set build-day. No purple/violet. No gradients.
Run the §9 vibe-code checklist before marking any screen done. Full law: `design-standards` skill.

## Coding standards

- TypeScript strict; `noUncheckedIndexedAccess` is on — guard array/record access.
- Server components by default; `"use client"` only where interactivity requires it.
- No secrets in client code. Client-safe flags via `lib/client-features.ts` (NEXT_PUBLIC_*).
- Structured logging via `lib/logger.ts` — no external observability stack.
- Match the surrounding code's style, naming, and comment density.

## Verification (nothing ships untested)

Before any handoff: `pnpm typecheck && pnpm lint && pnpm build` clean, then `/verify` — watch it
work in the running app. RBAC negative test at the API is mandatory. Full contract: `qa-verify`
skill. Reviewer prep is written *as you build* in `docs/reviewer-prep.md` (gitignored):
`reviewer-doc` skill.

---

## Build-day sync — DONE at 9:30 (carpooling)

- [x] **Domain + project name** — Enterprise Carpooling (top of this file)
- [x] **Final schema** — 11 domain tables + extended user/supportTicket/activityLog under
  `db/schema/`, migrated to Neon (20 tables, 14 enums, 81 indexes). One file per table.
- [x] **Ownership map** — `docs/team-ownership.md` (A Shivam · B Hetvi · C Shreya · D Mitesh)
- [x] **Roles + tenancy** — `super_admin/company_admin/employee` in `lib/permissions.ts`; every new
  resource in the statement; `scopedWhere` orgId scoping + `requireSuperAdmin`; 404-not-403.
- [x] **Accent** — teal-700 `#0f766e` in `lib/design-tokens.ts` + `app/globals.css` (dark: teal-400).
- [x] **Route skeleton** — `/platform` (super-admin), `/admin` (company-admin), employee app; nav
  targets roles explicitly (`nav.config.ts` `roles[]`).

**Project-specific conventions (carpooling):**

- Copy `features/_demo/` per entity as before, but domain tables carry `orgId` — scope every query
  with `scopedWhere(tenant, table, extraClause?)` from `@/lib/permissions`. `requirePermission`
  returns `{ session, tenant }`; use `tenant.orgId` on inserts and `logActivity`.
- Cross-org fetch by id → scoped fetch returns nothing → throw `NotFoundError` (404, never 403).
- Money/lat-lng are `numeric` (Drizzle returns strings — coerce in Zod). Geo points are `jsonb`
  (`GeoPoint` from `db/schema/ride.ts`). Reports are computed, not stored.
- One realtime system (Pusher) carries both tracking and chat, keyed per trip.

**Still open for the slices (not scaffold work):** the feature screens/APIs per slice, integration
keys (Pusher/Stripe in `.env.local` + Vercel), the Leaflet/OSRM map component, Stripe webhook.
