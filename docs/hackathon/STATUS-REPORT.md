# Status Report — Enterprise Carpooling Platform

**Odoo × KSV Hackathon · Team:** Shivam (lead/integrator), Shreya, Hetvi, Mitesh
**As of:** build-day, post-9:30 sync. Repo: `github.com/ShivamPatel145/Carpooling-Platform`

---

## What's DONE (foundation + 9:30 sync — verified)

### Scaffold (reused from prep, verified 22/22 earlier)
Next.js 15 · React 18 · TypeScript (strict) · Tailwind v3 + shadcn/ui (23 primitives) · Framer Motion
· RHF + Zod · TanStack Query · Drizzle + Neon · Auth.js v5 · UploadThing · Resend + React Email ·
@react-pdf (worker-thread pipeline) · pnpm. Role-aware dashboard shell, generic `<DataTable>`
(search/filter/paginate), generic CRUD template (`features/_demo/`), five data-state primitives,
typed API wrapper + error handling, structured logger, activity log, email/upload/PDF utilities.

### Domain adaptation (today's 9:30 sync)
- **Schema — 20 tables migrated to Neon** (14 enums, 81 indexes). 11 new carpooling tables:
  `organization, invitation, vehicle, savedPlace, ride, booking, trip, tripEvent, message, payment,
  walletEntry`; extended `user` (orgId, phone, status, platformAccess, department, manager,
  officeLocation), `supportTicket` (orgId, rideId), `activityLog` (orgId). One file per table.
- **RBAC + multi-tenancy** (`lib/permissions.ts`): roles `super_admin`/`company_admin`/`employee`
  (100/50/10). Every resource in the statement object. **`scopedWhere(tenant, table, extra?)`**
  applies the orgId filter at the guard so no route can forget it. **`requireSuperAdmin()`** is the
  one audited cross-tenant path. **Cross-org access → 404, not 403.** `platformAccess=revoked` refused
  at the guard. `requirePermission` now returns `{ session, tenant }`. Cascaded through auth/session/
  nav/config.
- **Accent:** teal-700 `#0f766e` (movement + sustainability), dark teal-400 — WCAG AA verified. The
  only colour that changed.
- **Routes:** `/platform` (super-admin) console skeleton, `/admin` (company-admin), employee app; nav
  targets roles explicitly. `docs/wireframe-map.md` maps all ~40 wireframe screens → routes.
- **Seed:** 2 orgs (Acme = auto-approve, Globex = approval-queue), super_admin + 2 admins + ~6
  employees, vehicles (mixed approval), rides, a booking, wallet ledger, saved places, notifications,
  a support ticket. App opens populated; both approval modes + cross-org isolation are demoable.
- **Docs:** PRD.md, wireframe-screens.md, wireframe-map.md, team-ownership.md, carpooling skill refs
  (drizzle + rbac tenancy), CLAUDE.md updated.

### Verified today
- `pnpm typecheck` clean · `pnpm lint` clean · `pnpm build` clean (24 routes).
- **16/16 runtime tenancy + RBAC tests pass:** all three roles log in; `/platform` is super-admin-only
  (employee + company_admin redirected); `/admin` gates employees out; employee refused at the API
  (403); activity-log org-scoped (each admin its own view; super_admin cross-tenant); unauth blocked
  (401 / redirect to /login). 0 server errors.
- **Pushed to GitHub** (main + 4 slice branches). Secrets (`.env.local`, `docs/reviewer-prep.md`) not
  tracked.

---

## Git branches (created + pushed)

| Branch | Owner | Slice |
|---|---|---|
| `main` | Shivam (integrator) | protected-by-convention; hourly merge target |
| `slice-a-ride-engine` | Shivam | vehicles, rides, bookings, Find/Offer, matching, route map |
| `slice-b-trips-tracking` | Hetvi | trip lifecycle, Pusher live tracking, chat, saved places, notifications |
| `slice-c-payments-reports` | Shreya | Stripe, wallet ledger, payments, reports, ride history |
| `slice-d-tenancy-admin` | Mitesh | orgs, invitations, admin + super-admin consoles, 3 onboarding paths |

Each teammate: `git fetch && git checkout <their-branch>`, build, commit small + often, push. Integrator
merges each into `main` hourly (`:50`), `pnpm build`, push, confirm deploy green. Everyone pulls `main`
at the top of each hour.

---

## What's NOT done yet (the slices' build-day work)

- **All feature screens/APIs per slice** (see the four SLICE-*.md prompts) — none built yet; only the
  schema, tenancy, route skeleton, and seed exist.
- **Integration keys still needed:** Pusher (`PUSHER_*` + `NEXT_PUBLIC_PUSHER_KEY`), Stripe test
  (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`). OSRM/OSM need
  none. Google/Resend/UploadThing already configured.
- **The Leaflet + OSRM map component** (Slice A builds, B consumes).
- **Stripe webhook verification on the deployed URL** (Slice C).
- **Vercel deploy** of the carpooling build + live-URL check of PDF/Pusher/Stripe.
- **`.env.example` update** for the new Pusher/Stripe vars (integrator, quick).

---

## Blockers / risks to watch

- **Disk space on the lead machine is ~full** — `pnpm build`/`install` may fail until temp/C: is
  cleared. Clear it before the next build cycle.
- Pusher-vs-polling decision owned by Hetvi — **decide by hour 6.**
- Stripe webhooks are flaky on serverless — test on the **deployed URL** early (Shreya).
- Tenancy is load-bearing: every slice must scope with `scopedWhere` and honour 404-not-403. Mitesh
  owns correctness; QA runs the four RBAC negatives before any slice is "done."

## The demo loop (the tiebreaker on any ambiguity — PRD §11)

Offer → Find & book → start → track live + chat → complete → pay from wallet → history → analytics
ticks up. Then coda: admin participation moved, super-admin shows two isolated orgs. A choice that
keeps this loop working wins. Bonus features wait until the loop is unbroken. **Feature freeze hour 12.**
```
