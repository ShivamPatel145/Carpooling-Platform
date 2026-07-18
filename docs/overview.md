# Product Overview

**Enterprise Carpooling Platform** — the Odoo × KSV hackathon final-round build. Full spec:
`docs/PRD.md`. This page is the one-screen summary; the PRD is the source of truth.

## Problem statement

Daily commuting is expensive, congested, and wasteful, and employees on similar routes have no easy
way to share a car. Organizations want their staff to carpool but have no tool that keeps each
company's data isolated, matches colleagues on overlapping routes, and settles the cost.

## Chosen domain

**Multi-tenant enterprise carpooling.** Employees of a registered organization discover and share
rides along common commutes. The same employee is a **mode-switcher** — one account **offers a ride**
(as a driver in their own vehicle) and **finds a ride** (as a passenger). Around that core sit
vehicle management, a trip lifecycle with **live map tracking**, in-app **chat**, **wallet + card
payments**, ride history, and a **cost/fuel analytics dashboard**.

## One-line value prop

**"Ride Together, Save Together."** — cut commute cost and congestion by matching colleagues on
overlapping routes, with live tracking, chat, and wallet payments.

## Primary users → role mapping

Three distinct roles (not nested tiers — three separate consoles). The enum lives in
`db/schema/user.ts` (`userRoleEnum`); the permission sets in `lib/permissions.ts`.

| App role        | Hierarchy | Who they are                                                                                   |
| --------------- | --------- | ---------------------------------------------------------------------------------------------- |
| `super_admin`   | 100       | Platform operator (us). Cross-tenant; onboards organizations. The one isolation exception.     |
| `company_admin` | 50        | One per org. Configuration only — employees, vehicles, cost settings. No ride ops.             |
| `employee`      | 10        | The primary user and mode-switcher: offers *and* finds rides. Scoped to own org + own records. |

The demo loop is driven entirely by `employee`; `company_admin` and `super_admin` appear in the
20-second coda (participation moved · two isolated orgs).

## Requirement → Slice traceability

Every mandatory module from the PRD maps to one slice. Slice ownership: `docs/team-ownership.md`.

| #   | Requirement                                        | Slice | Built on                                       | Status |
| --- | -------------------------------------------------- | ----- | ---------------------------------------------- | ------ |
| 1   | Three roles + RBAC + multi-tenancy                 | D     | Auth.js + `lib/permissions.ts` (`scopedWhere`) | done   |
| 2   | Org onboarding — 3 paths (bootstrap/invite/domain) | D     | `invitation` table + domain match              | done   |
| 3   | Vehicle management + admin approval                | A / D | Generic CRUD (`features/vehicle/`)             | done   |
| 4   | Offer / Find a ride + OSRM route match             | A     | NEW — ride engine (`ride`, `booking`)          | done   |
| 5   | Trip lifecycle + live tracking (Pusher)            | B     | NEW — `trip`, `tripEvent` + Pusher             | done   |
| 6   | Per-trip chat + `tel:` call                        | B     | NEW — `message` over Pusher                    | done   |
| 7   | Payments + append-only wallet ledger (Stripe)      | C     | NEW — `payment`, `walletEntry` + Stripe        | done   |
| 8   | Ride history + reports/analytics                   | C     | Computed read-model + PDF/charts pipeline      | done   |
| 9   | Company-admin + super-admin consoles               | D     | NEW — org/user/invitation management           | done   |

## Out of scope (deliberately)

- **In-app voice/WebRTC** — "call" is a `tel:` deep-link to the counterparty's phone.
- **Native mobile apps** — responsive web (holds at 375px), not React Native.
- **Razorpay** — Stripe test mode instead (config swap; sandbox parity).
- **Self-hosted routing** — public OSRM demo server for the hackathon (note self-host for prod).
- **Intelligent matching / route optimization** — bonus only, after the §11 demo loop is unbroken.
