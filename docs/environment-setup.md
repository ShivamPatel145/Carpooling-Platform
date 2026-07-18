# Environment Setup

Get from a fresh clone to a running dev server.

## Prerequisites

- **Node 20+** (`engines.node` is `>=20.0.0`).
- **pnpm** (`npm i -g pnpm`). This repo uses pnpm; a `pnpm-lock.yaml` is committed.
- **A Postgres database.** For the hackathon: a **local Postgres** (default). For hosting: a **Neon**
  branch. The driver is switchable via `DB_DRIVER` — see `docs/database.md`.

## First run

```bash
git clone <repo-url>
cd "Odoo x KSV"

pnpm i                       # install dependencies

cp .env.example .env.local   # then fill in the values (see below)
# minimum to boot: DATABASE_URL + AUTH_SECRET
#   hackathon → local Postgres, e.g. postgresql://postgres:postgres@localhost:5432/carpooling
#   hosting   → Neon POOLED host + DB_DRIVER=neon (auto-detected for a neon.tech URL)

pnpm db:migrate              # apply migrations to the DB in DATABASE_URL
pnpm db:seed                 # load demo data (2 orgs + admins + employees + a ride)

pnpm dev                     # http://localhost:3000
```

> On Neon, **migrate against your own branch, never `main`.** Local Postgres is per-machine.
> See `docs/database.md`.

## Demo logins (after `pnpm db:seed`)

Password `Password123!` for all. Two orgs demo both onboarding modes.

| Email                 | Role            | Org / notes                                       |
| --------------------- | --------------- | ------------------------------------------------- |
| `superadmin@demo.dev` | `super_admin`   | Platform operator (cross-tenant).                 |
| `admin@demo.dev`      | `company_admin` | Acme Mobility (auto-approve on domain match).     |
| `employee@demo.dev`   | `employee`      | Acme Mobility — driver in the demo loop.          |
| `rider@demo.dev`      | `employee`      | Acme Mobility — passenger in the demo loop.       |
| `admin@globex.dev`    | `company_admin` | Globex Transit (manual approval queue).           |
| `kabir@globex.dev`    | `employee`      | Globex Transit — demonstrates the approval queue. |

## Environment variables

Mirror of `.env.example`. Copy it to `.env.local` (git-ignored) and fill in. The lead distributes
real values via the team password manager — never commit `.env.local`.

### Required (needed to boot)

| Variable       | What it is                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL` | Neon Postgres connection string. **Must be the POOLED host** (contains `-pooler`). Use your own branch. |
| `AUTH_SECRET`  | Auth.js session encryption secret. Generate with `npx auth secret`.                                     |

### Optional (each gates a feature; app boots without them)

| Variable                                                            | Enables                                     | If absent…                                                        |
| ------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------- |
| `AUTH_GOOGLE_ID`                                                    | Google OAuth login                          | Credentials login still works.                                    |
| `AUTH_GOOGLE_SECRET`                                                | Google OAuth login                          | —                                                                 |
| `RESEND_API_KEY`                                                    | Sending email via Resend                    | Emails are logged, not sent.                                      |
| `UPLOADTHING_TOKEN`                                                 | File uploads (server)                       | Upload UI disables itself.                                        |
| `NEXT_PUBLIC_UPLOADS_ENABLED`                                       | Client knows uploads are on                 | Set `"true"` when `UPLOADTHING_TOKEN` is configured.              |
| `NEXT_PUBLIC_APP_URL`                                               | Absolute links (emails, OAuth)              | Defaults to `http://localhost:3000`; set to deployed URL in prod. |
| `PUSHER_APP_ID` / `PUSHER_KEY` / `PUSHER_SECRET` / `PUSHER_CLUSTER` | Live tracking + chat (server)               | Realtime features disable; tracking falls back to polling.        |
| `NEXT_PUBLIC_PUSHER_KEY` / `NEXT_PUBLIC_PUSHER_CLUSTER`             | Realtime client subscribe                   | Client can't subscribe to trip channels.                          |
| `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`          | Card payments + wallet recharge (test mode) | Card/recharge disabled; wallet/cash still work.                   |
| `STRIPE_WEBHOOK_SECRET`                                             | Verify Stripe webhook signatures            | Webhook rejects events; use the Stripe CLI locally.               |

> **Maps/routing (OSRM + Leaflet) need no key** — Leaflet renders OSM tiles and OSRM's public demo
> server handles routing/ETA. Self-host OSRM for production (see `docs/decisions.md` ADR-011).

## Neon branch step

1. Neon console → your project → **Branches** → confirm you have `dev-1`…`dev-4` and know which is
   yours.
2. Branch → **Connection Details** → copy the **Pooled connection** string into `DATABASE_URL`.
3. Run `pnpm db:migrate` — this touches **your** branch only. `main` is reconciled at deploy time.

## Scripts

| Script             | Command                    | Purpose                                           |
| ------------------ | -------------------------- | ------------------------------------------------- |
| `pnpm dev`         | `next dev`                 | Dev server (http://localhost:3000).               |
| `pnpm build`       | `next build`               | Production build.                                 |
| `pnpm start`       | `next start`               | Serve the production build locally.               |
| `pnpm lint`        | `next lint`                | ESLint.                                           |
| `pnpm typecheck`   | `tsc --noEmit`             | TypeScript strict check (run before every merge). |
| `pnpm db:generate` | `drizzle-kit generate`     | Generate SQL migrations from `db/schema/`.        |
| `pnpm db:migrate`  | `tsx db/migrate.ts`        | Apply pending migrations to your branch.          |
| `pnpm db:push`     | `drizzle-kit push`         | Push schema directly (throwaway spikes only).     |
| `pnpm db:studio`   | `drizzle-kit studio`       | Browse the database in the browser.               |
| `pnpm db:seed`     | `tsx db/seed.ts`           | Seed demo data.                                   |
| `pnpm email`       | `email dev --dir emails …` | React Email preview server (port 3001).           |

## Troubleshooting

- **Too many connections / connection errors under load** → you're on the direct host. Switch
  `DATABASE_URL` to the `-pooler` host.
- **Auth throws on boot** → `AUTH_SECRET` is missing or empty.
- **Upload button greyed out** → expected without `UPLOADTHING_TOKEN` / `NEXT_PUBLIC_UPLOADS_ENABLED`.
- **Live tracking / chat silent** → Pusher vars missing; tracking falls back to polling. Set the
  `PUSHER_*` and `NEXT_PUBLIC_PUSHER_*` pair.
- **Card payment / recharge fails** → set the `STRIPE_*` keys (test mode). Wallet + cash work
  without them. For local webhooks, run `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
- **Map blank or routes missing** → OSRM demo server rate-limited; route geometry is cached on the
  `ride` row, so retry. No key is needed for maps/routing.
