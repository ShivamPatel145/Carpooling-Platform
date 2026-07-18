# Database

PostgreSQL on **Neon**, accessed through **Drizzle ORM** (`drizzle-orm`) with **drizzle-kit** for
migrations. Full conventions live in the `drizzle-schema` skill — read it before touching any table.

## Connection

- **Always the POOLED host.** `DATABASE_URL` must contain `-pooler` (Neon console → Connection
  Details → *Pooled connection*). The direct host exhausts connections under Vercel serverless.
- **Per-dev branches.** Each developer works on their own Neon branch: `dev-1`, `dev-2`, `dev-3`,
  `dev-4`. **Migrate against your own branch — never `main`.** `main` is reconciled at deploy time
  (see `docs/deployment.md`).
- Config: `drizzle.config.ts`. Client + query helper: `db/index.ts`.

## Migration workflow

Never hand-edit generated SQL, and never `db:push` to a shared branch. The loop:

```
pnpm db:generate     # drizzle-kit reads db/schema/*, emits SQL into db/migrations/
# → READ the generated SQL. Every time. Confirm it does what you meant (drops? renames? data loss?).
pnpm db:migrate      # applies pending migrations to YOUR branch (tsx db/migrate.ts)
pnpm db:studio       # optional: drizzle-kit studio to inspect the result
```

- `pnpm db:seed` (`tsx db/seed.ts`) loads demo data — an admin user and sample rows.
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

## Table catalog (existing, generic)

All domain-agnostic. `TODO(build-day)` decides which to reuse as-is vs extend by reference.

| Table               | File                          | Purpose                                                        |
| ------------------- | ----------------------------- | -------------------------------------------------------------- |
| `user`              | `db/schema/user.ts`           | People + `role` enum (admin / manager / approver / user).      |
| `account`           | `db/schema/account.ts`        | Auth.js OAuth provider accounts (adapter table).               |
| `session`           | `db/schema/session.ts`        | Auth.js sessions.                                              |
| `verificationToken` | `db/schema/session.ts`        | Auth.js email/verification tokens (co-located with sessions).  |
| `notification`      | `db/schema/notification.ts`   | Per-user notifications (typed); drives the shell bell.         |
| `activityLog`       | `db/schema/activity-log.ts`   | Immutable audit trail; written only via `logActivity`.         |
| `systemSetting`     | `db/schema/system-setting.ts` | Key/value app settings surfaced in admin settings.             |
| `supportTicket`     | `db/schema/support-ticket.ts` | Generic ticketing (status + priority enums, assignment).       |
| `demoEntity`        | `db/schema/demo-entity.ts`    | The CRUD copy template — the reference for a domain entity.     |

> Note: `verificationToken` lives inside `session.ts` (Auth.js adapter tables are grouped), which is
> the one intentional exception to strict one-file-per-table.

## Domain tables (build-day)

`TODO(build-day)` — add one file per domain table under `db/schema/`, one export line in the barrel
(via the integrator), then run the migration workflow above.

| Table             | File                       | Purpose            | Extends by reference? |
| ----------------- | -------------------------- | ------------------ | --------------------- |
| `TODO(build-day)` | `db/schema/<entity>.ts`    | `TODO(build-day)`  | e.g. FK → `user`      |
