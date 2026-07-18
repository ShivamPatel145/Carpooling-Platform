# Database

PostgreSQL accessed through **Drizzle ORM** (`drizzle-orm`) with **drizzle-kit** for migrations.
Full conventions live in the `drizzle-schema` skill — read it before touching any table.

## Connection & driver

The DB driver is **switchable** — `db/index.ts` (and `migrate.ts`/`seed.ts`) keep both code paths,
selected by the `DB_DRIVER` env var:

- **`postgres` (default) — local Postgres** via `node-postgres` (`pg`). This is the **hackathon**
  setup (per reviewer guidance): run a local Postgres and point `DATABASE_URL` at it, e.g.
  `postgresql://postgres:postgres@localhost:5432/carpooling`.
- **`neon` — Neon serverless** via the HTTP driver, for **hosting** (Vercel). Use the POOLED host
  (contains `-pooler`); the direct host exhausts connections under serverless load. Auto-selected
  when `DATABASE_URL` points at a `neon.tech` host even if `DB_DRIVER` is left at its default.

Flip one env var to switch — no code changes. Both drivers expose the same Drizzle query-builder
surface, so call sites are identical.

- **Per-dev branches (Neon hosting).** On Neon, each developer works on their own branch (`dev-1`…);
  **migrate against your own branch — never `main`.** `main` is reconciled at deploy time
  (see `docs/deployment.md`). Local Postgres is per-machine, so this doesn't apply there.
- Config: `drizzle.config.ts`. Client + query helper: `db/index.ts`.

## Migration workflow

Never hand-edit generated SQL, and never `db:push` to a shared branch. The loop:

```bash
pnpm db:generate     # drizzle-kit reads db/schema/*, emits SQL into db/migrations/
# → READ the generated SQL. Every time. Confirm it does what you meant (drops? renames? data loss?).
pnpm db:migrate      # applies pending migrations to YOUR branch (tsx db/migrate.ts)
pnpm db:studio       # optional: drizzle-kit studio to inspect the result
```

- `pnpm db:seed` (`tsx db/seed.ts`) loads demo data — two orgs, their admins/employees, vehicles,
  a published ride, and notifications. Idempotent. Logins in `docs/environment-setup.md`.
- `db:push` exists for throwaway spikes on your own branch only. Migrations are the source of truth.

## Schema conventions

- **One file per table:** `db/schema/<table>.ts`, re-exported from the barrel `db/schema/index.ts`.
- **Every table gets `id` (uuid), `createdAt`, `updatedAt`** via `...timestamps` spread from
  `db/schema/_shared.ts`. Do not redeclare these.
- **Extend generic tables by reference, never duplicate.** Need to attach domain data to a user,
  a notification, or an activity entry? Reference the existing table by FK. Do **not** copy `user`
  into `domainUser`, or re-invent `notification`. Duplication is the anti-pattern this scaffold
  exists to prevent.
- Zod schemas are derived from the table (`drizzle-zod`) and re-exported through the feature's
  `schema.ts` so table, validation, and types never drift.
- `db/schema/index.ts` is a **shared file** — only the integrator edits it, at a sync point.

## Table catalog (generic — extended by reference, never duplicated)

Domain-agnostic tables carried from Phase 0. `user` and `supportTicket` were **extended** for
carpooling (new columns), never copied.

| Table               | File                          | Purpose                                                                                                                                                                              |
| ------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `user`              | `db/schema/user.ts`           | People + `role` enum (`super_admin` / `company_admin` / `employee`). Extended: `orgId`, `phone`, `status`, `avatarUrl`, `department`, `manager`, `officeLocation`, `platformAccess`. |
| `account`           | `db/schema/account.ts`        | Auth.js OAuth provider accounts (adapter table).                                                                                                                                     |
| `session`           | `db/schema/session.ts`        | Auth.js sessions.                                                                                                                                                                    |
| `verificationToken` | `db/schema/session.ts`        | Auth.js email/verification tokens (co-located with sessions).                                                                                                                        |
| `notification`      | `db/schema/notification.ts`   | Per-user notifications (typed); drives the shell bell.                                                                                                                               |
| `activityLog`       | `db/schema/activity-log.ts`   | Immutable audit trail; written only via `logActivity`.                                                                                                                               |
| `systemSetting`     | `db/schema/system-setting.ts` | Key/value app settings surfaced in admin settings.                                                                                                                                   |
| `supportTicket`     | `db/schema/support-ticket.ts` | Generic ticketing (status + priority enums, assignment). Extended: optional `rideId` so "Report an issue" links to a ride.                                                           |

> Note: `verificationToken` lives inside `session.ts` (Auth.js adapter tables are grouped), which is
> the one intentional exception to strict one-file-per-table.

## Domain tables (carpooling)

One file per table, barrel-exported from `db/schema/index.ts` (integrator only). Every domain table
carries a non-null `orgId` FK to `organization` (the tenant root; the sole exception). Money and
lat/lng are `numeric` (Drizzle returns strings — coerce in Zod); geo points are `jsonb` (`GeoPoint`
from `db/schema/ride.ts`). Slice ownership: `docs/team-ownership.md`.

| Table          | File                        | Purpose                                                                                        | Slice |
| -------------- | --------------------------- | ---------------------------------------------------------------------------------------------- | ----- |
| `organization` | `db/schema/organization.ts` | Tenant root: name, allowed email domains, currency, cost config, auto-approve. **No `orgId`.** | D     |
| `invitation`   | `db/schema/invitation.ts`   | Tokenized invites (bootstrap admin · staff invite). Backs onboarding Paths 1 & 2.              | D     |
| `vehicle`      | `db/schema/vehicle.ts`      | Employee vehicles + approval status. The reference org-scoped CRUD slice.                      | A     |
| `ride`         | `db/schema/ride.ts`         | Published rides: origin/destination (jsonb), seats, fare, cached OSRM route geometry.          | A     |
| `booking`      | `db/schema/booking.ts`      | Seat bookings; atomic conditional decrement of `ride.seatsAvailable`.                          | A     |
| `savedPlace`   | `db/schema/saved-place.ts`  | Home/Office/custom locations; power swap + autofill on Find/Offer.                             | B     |
| `trip`         | `db/schema/trip.ts`         | Trip lifecycle (one per started ride) + live driver location.                                  | B     |
| `tripEvent`    | `db/schema/trip-event.ts`   | Trip audit + tracking event stream.                                                            | B     |
| `message`      | `db/schema/message.ts`      | Per-trip chat, delivered over Pusher.                                                          | B     |
| `payment`      | `db/schema/payment.ts`      | One payment per booking; Stripe payment-intent id.                                             | C     |
| `walletEntry`  | `db/schema/wallet-entry.ts` | Append-only ledger; balance = sum of deltas.                                                   | C     |

**Reports are computed, not stored** — a query over `trip` + `ride` + `vehicle` + `walletEntry`,
`orgId`-scoped. The Financial Summary (Revenue / Fuel / Maintenance / Net Profit) derives the same
way from the org's cost config × distance.

### Key enums

`userRole` (super_admin, company_admin, employee) · `userStatus` (pending, active, inactive) ·
`platformAccess` (active, revoked) · `rideStatus` · `bookingStatus` · `tripStatus`
(booked → started → in_progress → completed → payment_pending → payment_completed) ·
`paymentMethod` (cash, card, upi, wallet) · `paymentStatus` · `invitationStatus`.
Each `pgEnum` lives in its table's file.
