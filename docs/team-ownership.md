# Team Ownership — Enterprise Carpooling

Four vertical slices, split to minimize shared-file overlap (from PRD §9). Generic-heavy work (C, D)
is least domain-coupled; the ride engine (A) is heaviest and most judged. **Slice D's tenancy
pattern blocks everyone — it landed at the 9:30 sync (`lib/permissions.ts`), so everyone builds on
it from their first commit.**

## The shared files — INTEGRATOR ONLY (Shivam). PreToolUse hook enforces it.

`db/schema/index.ts` (barrel) · root `app/layout.tsx` · `nav.config.ts` · `dashboard.config.ts` ·
`homepage.config.ts` · `CLAUDE.md` · `lib/permissions.ts`.

Need a nav entry, a barrel export, or a statement resource? **Ask the integrator at :50.** Editing
these yourself is how last year's merge conflicts started.

---

## SLICE A — Ride Engine · Shivam (also integrator)

The core product and the first thing a reviewer clicks. Vehicles, rides, bookings, matching,
Find/Offer, route confirmation, ride cancellation. Shivam takes this *and* integrates because it
sits at the center of every seam.

| | |
|---|---|
| **Owns (tables)** | `vehicle`, `ride`, `booking` |
| **Route group** | `/app/find`, `/app/offer`, `/app/rides/*`, `/app/vehicles` (employee app) |
| **API folders** | `app/api/vehicle/`, `app/api/ride/`, `app/api/booking/` (fixed shape: route/[id]/my/stats) |
| **Feature folders** | `features/vehicle/` (reference slice), `features/ride/`, `features/booking/` |
| **Shared component owned** | the **Leaflet + OSRM map** (Find, Offer, and Slice B's tracking all consume it) |
| **MUST NOT touch** | the shared files above; Slice B's `trip*`/`message`; Slice C's `payment`/`wallet`; Slice D's `organization`/`user` |
| **Done when** | publish → another employee finds & books → seats decrement → both see it in My Trips |

## SLICE B — Trips, Tracking & Chat · Hetvi

The most technically novel slice — realtime is where the demo wows or dies. Trip lifecycle, Pusher
wiring, live tracking, chat, `tel:` call, saved places, settings hub, notification wiring.

| | |
|---|---|
| **Owns (tables)** | `trip`, `tripEvent`, `message`, `savedPlace` |
| **Route group** | `/app/trips/*` (incl. `/track`), `/app/saved-places`, `/settings` (employee app) |
| **API folders** | `app/api/trip/`, `app/api/message/`, `app/api/saved-place/`, `app/api/pusher/auth` |
| **Feature folders** | `features/trip/`, `features/message/`, `features/saved-place/` |
| **Authority** | owns the **Pusher-vs-polling** call — decided by hour 6, not hour 20 |
| **MUST NOT touch** | shared files; Slice A's `ride`/`booking` schema; Slice C's `payment`; Slice D's tenancy |
| **Done when** | driver starts → passenger sees marker move + ETA + can chat, live → driver completes → status → payment_pending |

## SLICE C — Payments, Wallet & Reports · Shreya (also design driver)

Self-contained and pipeline-rich (PDF + charts already exist). Stripe, wallet ledger, payment
methods, analytics dashboard, ride history.

| | |
|---|---|
| **Owns (tables)** | `payment`, `walletEntry`, and the computed **report read-model** |
| **Route group** | `/app/pay/*`, `/app/wallet`, `/app/history`, `/reports` (employee + admin reports) |
| **API folders** | `app/api/payment/`, `app/api/wallet/`, `app/api/stripe/webhook`, `app/api/report/` |
| **Feature folders** | `features/payment/`, `features/wallet/`, `features/report/` |
| **Design-driver duty** | `/design-sync` + publish before 9:30, then drive Claude Design. Slice is lightest at 10:00 (charts wait on data until hour 4) — the room Design needs. |
| **MUST NOT touch** | shared files; other slices' schema. Reads `trip`/`ride`/`walletEntry` + org cost config for reports. |
| **Done when** | complete a trip → pay via wallet AND Stripe test card → balance updates → trip in history → analytics moves |

## SLICE D — Tenancy, Admin & Onboarding · Mitesh

Multi-tenant foundation (load-bearing — landed first), the three onboarding paths, invitation flow,
super-admin console, company-admin console, employee/vehicle oversight, org + cost settings.

| | |
|---|---|
| **Owns (tables)** | `organization`, `invitation`, `user` extensions |
| **Route group** | `/platform/*` (super-admin), `/admin/*` (company-admin), the three onboarding paths |
| **API folders** | `app/api/organization/`, `app/api/invitation/`, `app/api/user/` (admin employee mgmt) |
| **Feature folders** | `features/organization/`, `features/invitation/`, admin employee/vehicle surfaces |
| **Critical** | the `orgId` scoping pattern is in `lib/permissions.ts` (`scopedWhere`, `requireSuperAdmin`) — DONE at 9:30. Everyone consumes it. |
| **MUST NOT touch** | shared files (route nav additions via integrator); other slices' ride/trip/payment schema |
| **Done when** | two orgs seeded → Org A admin can't see Org B's anything (**404, not 403**) → admin configures fuel cost → it flows into Slice C's reports → all three onboarding paths work |

---

## Cross-slice seams (each has ONE named owner)

| Seam | Who signals | Who consumes | **Owner of the handoff** |
|---|---|---|---|
| booking → trip | A creates the trip record | B drives its lifecycle | **B** |
| trip completed → payment | B signals completion | C collects payment | **C** |
| cost config → reports | D configures org cost | C computes reports | **C** |
| `orgId` everywhere | D defines the pattern | all apply it | **D** (pattern); everyone applies |
| onboarding → role redirect | D owns all three consoles' entry routing | — | **D** |

An unowned seam is how last year's integration failed. If you find yourself editing another slice's
files, stop — you've hit a seam, and its owner is named above.

## Tenancy — the rule everyone applies (from `rbac-guard/reference.md`)

Every domain query for a non-super-admin goes through `scopedWhere(tenant, table, extraClause?)` so
the `orgId` filter can't be forgotten. Cross-org fetch by id → return nothing → **404, not 403**.
`requireSuperAdmin()` is the ONE cross-tenant path. `platformAccess === 'revoked'` is refused at the
guard. QA runs the four mandatory RBAC negatives before any slice is "done."

## The demo loop (the tiebreaker on any ambiguity — PRD §11)

Offer → Find & book → start → track live + chat → complete → pay from wallet → history → analytics
ticks up. Then coda: admin participation moved, super-admin shows two isolated orgs. **A choice that
keeps this loop working wins.** Bonus features wait until the loop is unbroken. Feature freeze hour 12.
