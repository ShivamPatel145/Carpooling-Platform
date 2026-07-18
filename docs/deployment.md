# Deployment

Target: **Vercel** (app) + **Neon** (database). The deployed URL is a judging surface — **reviewers
arrive any hour, so it must stay green at every checkpoint.** A broken `main` deploy loses the demo.

## Vercel

1. **Link the repo** to a Vercel project (once, by the integrator). Framework preset: Next.js.
2. **Add environment variables** in Project → Settings → Environment Variables. Mirror the required
   set from `docs/environment-setup.md`:
   - `DATABASE_URL` → the **pooled** Neon `main` connection string (production DB, not a dev branch).
   - `AUTH_SECRET` → a fresh production secret (`npx auth secret`).
   - `NEXT_PUBLIC_APP_URL` → the deployed URL (e.g. `https://<project>.vercel.app`).
   - Optional feature vars (`AUTH_GOOGLE_*`, `RESEND_API_KEY`, `UPLOADTHING_TOKEN`,
     `NEXT_PUBLIC_UPLOADS_ENABLED`) as those features are turned on.
3. **OAuth redirect URIs** — if Google is enabled, add the Vercel preview + prod callback URLs in
   Google Cloud (`https://<domain>/api/auth/callback/google`).
4. **Deployed URL:** `TODO(build-day)` — paste it here once live, and pin it in the team channel.

## Neon (reconcile to main)

Devs work on `dev-1`…`dev-4`; **production runs on `main`.** Before/at deploy:

- Apply the merged migrations to `main` (from `db/migrations/`), not by pushing a dev branch over it.
- Confirm `main`'s schema matches the migrations committed to the repo — the deploy assumes they're
  in sync.
- Keep production `DATABASE_URL` on the **pooled** `main` host.
- `TODO(build-day)` — decide whether prod gets seed data or starts empty.

## Build

- Command: `next build` (Vercel default; no override needed).
- `@react-pdf/renderer` runs on the **Node runtime** — the invoice route sets `runtime = "nodejs"`
  and the package is in `serverExternalPackages` (`next.config.ts`). Keep any new PDF route on Node.
- Output: standard Next.js (no custom output mode).

## Pre-deploy checklist

Run before every push to `main` / integration checkpoint. Run the `qa-verify` skill first.

- [ ] `pnpm typecheck` passes (strict, zero errors).
- [ ] `pnpm lint` passes.
- [ ] `pnpm build` succeeds locally.
- [ ] Migrations generated, **SQL reviewed**, and committed; `main` reconciled.
- [ ] All required env vars set in Vercel (and any newly-added ones).
- [ ] Sign-in works on the deployed URL (credentials at minimum).
- [ ] Core happy path clicks through end-to-end on the deployed URL.
- [ ] No secrets committed (`.env.local` git-ignored).
- [ ] Deployed URL is green and shared in the team channel.

## Build-day deploy notes

`TODO(build-day)` — record domain-specific deploy concerns (webhooks, external service config, cron)
here, and log any deploy decision as an ADR in `docs/decisions.md`.
