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

## ADR-009 — Multi-tenancy enforced at the data layer, not per-route

**Status:** Accepted

**Context:** The carpooling platform is multi-tenant — Org A must never see Org B's data. Leaving
each route to remember an `orgId` filter is the classic tenancy leak: one forgotten `where` clause
exposes another company's rides.

**Decision:** Every domain table carries a non-null `orgId` (except `organization`), set once at
join time and immutable after. `requirePermission` resolves the session's tenant and every
non-super-admin query passes through `scopedWhere(tenant, table, extraClause?)` in
`lib/permissions.ts`. `requireSuperAdmin()` is the single, named cross-tenant exception. A cross-org
fetch by id returns **404, not 403** — we don't admit the record exists.

**Consequences:** Isolation is structural, not per-route discipline. The reviewer question "how do
you stop Org A seeing Org B" has a one-sentence answer. QA runs a cross-org 404 negative test. See
`docs/PRD.md` §5 and the `rbac-guard` skill.

---

## ADR-010 — Pusher for realtime; polling fallback decided by hour 6

**Status:** Accepted

**Context:** Live trip tracking and per-trip chat both need realtime. Vercel serverless can't hold
WebSocket connections.

**Decision:** Use **Pusher** (managed WebSockets) for **both** tracking and chat on one channel
keyed per trip. If Pusher isn't solid by hour 6, fall back to 4-second polling of
`trip.driverLat/Lng` — same UX, no channel plumbing. The call is made at hour 6, not hour 20.

**Consequences:** No socket server to run; one realtime system, not two. Auth via
`/api/pusher/auth` for private channels. See `docs/PRD.md` §7.6–7.7.

---

## ADR-011 — OpenStreetMap + Leaflet + OSRM, not Google Maps

**Status:** Accepted

**Context:** Find/Offer need route rendering + distance/ETA; live tracking needs a map. Google Maps
means an API key, billing, and a quota to blow at hour 20.

**Decision:** **Leaflet** (render, OSM tiles) + **OSRM** (routing/ETA), no API key. Cache
`routeGeoJSON`, `distanceKm`, `durationMin` on the `ride` row so we don't re-hit OSRM per view (also
mitigates demo-server rate limits). Note self-host OSRM for production.

**Consequences:** Zero-key, zero-billing for the hackathon. The shared map component (Slice A) is
consumed by Find, Offer, and Slice B tracking. See `docs/PRD.md` §7.4.

---

## ADR-012 — Stripe test mode + append-only wallet ledger

**Status:** Accepted

**Context:** Payments must settle on trip completion, with a rechargeable wallet. Razorpay was the
reference; we need fast, auditable integration.

**Decision:** **Stripe test mode** (config swap from Razorpay; sandbox parity). The wallet is an
**append-only** `walletEntry` ledger — balance = sum of deltas, never a mutable balance column.
Recharge = a positive entry funded by a Stripe intent; spend = a negative entry. Stripe confirms via
webhook at `/api/stripe/webhook`.

**Consequences:** Auditable by construction; the ledger doubles as an analytics source. Webhooks
must be verified against the **deployed URL**, not localhost. See `docs/PRD.md` §7.8.

---

## ADR-013 — Three roles (Super Admin added), not the spec's two

**Status:** Accepted

**Context:** The spec mandates one admin (config-only) and one employee (mode-switcher). But
organizations need to onboard through the product, not hand-seeded SQL.

**Decision:** Add **`super_admin`** (100) above `company_admin` (50) and `employee` (10). The spec's
two roles are intact; Super Admin only onboards organizations and views cross-org metrics — and is
the sole, audited tenancy exception (ADR-009).

**Consequences:** Orgs onboard self-service (three paths in `docs/PRD.md` §4.3). Adding the role was
one entry in `lib/permissions.ts`, not a conditional. See `db/schema/user.ts` (`userRoleEnum`).
