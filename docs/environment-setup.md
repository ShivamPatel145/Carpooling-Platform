# Environment Setup

Get from a fresh clone to a running dev server.

## Prerequisites

- **Node 20+** (`engines.node` is `>=20.0.0`).
- **pnpm** (`npm i -g pnpm`). This repo uses pnpm; a `pnpm-lock.yaml` is committed.
- A **Neon** account with your personal branch (`dev-1` … `dev-4`) — the lead provisions these.

## First run

```bash
git clone <repo-url>
cd "Odoo x KSV"

pnpm i                       # install dependencies

cp .env.example .env.local   # then fill in the values (see below)
# minimum to boot: DATABASE_URL (your Neon branch, POOLED host) + AUTH_SECRET

pnpm db:migrate              # apply migrations to YOUR Neon branch
pnpm db:seed                 # load demo data (admin user + sample rows)

pnpm dev                     # http://localhost:3000
```

> **Migrate against your own branch, never `main`.** See `docs/database.md`.

## Environment variables

Mirror of `.env.example`. Copy it to `.env.local` (git-ignored) and fill in. The lead distributes
real values via the team password manager — never commit `.env.local`.

### Required (needed to boot)

| Variable       | What it is                                                                    |
| -------------- | ----------------------------------------------------------------------------- |
| `DATABASE_URL` | Neon Postgres connection string. **Must be the POOLED host** (contains `-pooler`). Use your own branch. |
| `AUTH_SECRET`  | Auth.js session encryption secret. Generate with `npx auth secret`.           |

### Optional (each gates a feature; app boots without them)

| Variable                     | Enables                          | If absent…                                            |
| ---------------------------- | -------------------------------- | ----------------------------------------------------- |
| `AUTH_GOOGLE_ID`             | Google OAuth login               | Credentials login still works.                        |
| `AUTH_GOOGLE_SECRET`         | Google OAuth login               | —                                                     |
| `RESEND_API_KEY`             | Sending email via Resend         | Emails are logged, not sent.                          |
| `UPLOADTHING_TOKEN`          | File uploads (server)            | Upload UI disables itself.                            |
| `NEXT_PUBLIC_UPLOADS_ENABLED`| Client knows uploads are on      | Set `"true"` when `UPLOADTHING_TOKEN` is configured.  |
| `NEXT_PUBLIC_APP_URL`        | Absolute links (emails, OAuth)   | Defaults to `http://localhost:3000`; set to deployed URL in prod. |

## Neon branch step

1. Neon console → your project → **Branches** → confirm you have `dev-1`…`dev-4` and know which is
   yours.
2. Branch → **Connection Details** → copy the **Pooled connection** string into `DATABASE_URL`.
3. Run `pnpm db:migrate` — this touches **your** branch only. `main` is reconciled at deploy time.

## Scripts

| Script             | Command                    | Purpose                                          |
| ------------------ | -------------------------- | ------------------------------------------------ |
| `pnpm dev`         | `next dev`                 | Dev server (http://localhost:3000).              |
| `pnpm build`       | `next build`               | Production build.                                |
| `pnpm start`       | `next start`               | Serve the production build locally.              |
| `pnpm lint`        | `next lint`                | ESLint.                                          |
| `pnpm typecheck`   | `tsc --noEmit`             | TypeScript strict check (run before every merge).|
| `pnpm db:generate` | `drizzle-kit generate`     | Generate SQL migrations from `db/schema/`.       |
| `pnpm db:migrate`  | `tsx db/migrate.ts`        | Apply pending migrations to your branch.         |
| `pnpm db:push`     | `drizzle-kit push`         | Push schema directly (throwaway spikes only).    |
| `pnpm db:studio`   | `drizzle-kit studio`       | Browse the database in the browser.              |
| `pnpm db:seed`     | `tsx db/seed.ts`           | Seed demo data.                                  |
| `pnpm email`       | `email dev --dir emails …` | React Email preview server (port 3001).          |

## Troubleshooting

- **Too many connections / connection errors under load** → you're on the direct host. Switch
  `DATABASE_URL` to the `-pooler` host.
- **Auth throws on boot** → `AUTH_SECRET` is missing or empty.
- **Upload button greyed out** → expected without `UPLOADTHING_TOKEN` / `NEXT_PUBLIC_UPLOADS_ENABLED`.
- **`TODO(build-day)`** — record any domain-specific setup steps or new env vars here (and in
  `.env.example`).
