# Architecture Decision Record

A running log of decisions made in this scaffold. Each entry: **Title / Status / Context / Decision /
Consequences.** Add new decisions on build day as they're made — this is the reviewer's answer to
"why did you do X?". (See also the `reviewer-doc` skill and `docs/reviewer-prep.md`.)

---

## ADR-001 — Pin Next.js 15, not the 16 default

**Status:** Accepted

**Context:** `create-next-app` now defaults to a newer major. A hackathon cannot absorb churn from a
just-released major (breaking App Router changes, ecosystem lag).

**Decision:** Pin `next@15.1.4` and `eslint-config-next@15.1.4`.

**Consequences:** Stable, well-documented App Router; every dependency below is known to work with
15. Revisit only post-event.

---

## ADR-002 — Tailwind v3, not v4

**Status:** Accepted

**Context:** Tailwind v4 changes the config and CSS-variable model. shadcn/ui and our token model in
`lib/design-tokens.ts` are built and synced against the v3 conventions.

**Decision:** Use `tailwindcss@3.4.x` with `tailwind.config.ts` and the v3 CSS-variable approach.

**Consequences:** shadcn components and design tokens drop in without a migration. Cost: not on the
latest engine. Accepted for stability and to protect the synced design system.

---

## ADR-003 — React 18, not 19

**Status:** Accepted

**Context:** React 19 is current, but key libraries in our stack — `@react-pdf/renderer` and
`react-email` — trail on 19 support during the event window.

**Decision:** Pin `react@18.3.1` / `react-dom@18.3.1`.

**Consequences:** PDF and email pipelines work today. We forgo React 19 features (Actions,
`use`). Accepted — ecosystem compatibility beats new features for a two-day build.

---

## ADR-004 — Drizzle + Neon, not Prisma

**Status:** Accepted

**Context:** The reference repo used Prisma. Prisma's engine/binary and generate step add friction on
Vercel serverless; a type-first, SQL-close ORM suits the "read the generated SQL" migration
discipline we want.

**Decision:** Reject Prisma; use **Drizzle ORM** + **drizzle-kit** against **Neon** serverless
Postgres (pooled host).

**Consequences:** No generate/binary step; migrations are reviewable SQL; end-to-end TS types from
`drizzle-zod`. Team learns Drizzle's query builder. See `docs/database.md`.

---

## ADR-005 — Auth.js v5 with custom RBAC, not better-auth's access-control plugin

**Status:** Accepted

**Context:** We need role-based authorization with a defensible, single-source design. An
off-the-shelf access-control plugin hides the model and couples us to its auth library.

**Decision:** Use **Auth.js (next-auth v5 beta)** for authentication and a **custom RBAC layer** in
`lib/permissions.ts` — a `statement` object (resource→actions), per-role sets derived from it, a
numeric `roleHierarchy`, ownership helpers, and one `requirePermission` guard.

**Consequences:** Authorization is one readable file, not scattered `if (role === 'admin')` checks —
a direct reviewer talking point. Extending = add to `statement` + grant per role. Cost: we own the
code. See the `rbac-guard` skill.

---

## ADR-006 — One file per table schema convention

**Status:** Accepted

**Context:** A single monolithic schema file causes constant merge conflicts with four people adding
tables in parallel.

**Decision:** One table per file under `db/schema/<table>.ts`, re-exported from a barrel
`db/schema/index.ts`. Shared columns (`id`, `createdAt`, `updatedAt`) come from `_shared.ts`. Only
the integrator edits the barrel, at a sync point.

**Consequences:** Adding a table is a new file + one barrel line — minimal conflict surface. The
barrel is the single shared choke point, guarded by a PreToolUse hook. See `docs/database.md` and the
`drizzle-schema` skill.

---

## ADR-007 — scrypt password hashing, not bcrypt

**Status:** Accepted

**Context:** `bcrypt` needs a native build, which is fragile on Vercel's build image and across dev
machines. We still want a strong, salted KDF for credentials login.

**Decision:** Hash passwords with **scrypt** (Node's built-in `crypto`, in `lib/password.ts`) — no
native dependency.

**Consequences:** Zero native-build risk; Vercel-safe; no extra dependency. scrypt is a sound choice
for password storage.

---

## ADR-008 — @react-pdf/renderer, not headless-browser PDF

**Status:** Accepted

**Context:** The domain will likely need a printable artifact. Headless-Chromium PDF (Puppeteer)
means shipping/booting a browser binary — heavy and unreliable on Vercel serverless.

**Decision:** Generate PDFs with **`@react-pdf/renderer`** — pure JS, React components, on the Node
runtime. Pipeline in `lib/pdf/` with the `report/receipt/[tripId]` route as the reference.

**Consequences:** Vercel-safe, no browser binary; PDFs authored as components against real data.
Cost: `@react-pdf`'s layout model (flex subset), not full HTML/CSS. PDF routes must set
`runtime = "nodejs"`.

---

## Build-day decisions

`TODO(build-day)` — append domain decisions as ADR-009+ using the same template. Candidates:
chosen domain model, any external integration, soft-delete on specific tables, new roles/resources,
background jobs, deploy specifics.
