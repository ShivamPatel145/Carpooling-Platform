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
   - **Carpooling integration vars** — for the full demo loop:
     - Pusher (live tracking + chat): `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`,
       `PUSHER_CLUSTER`, `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER`.
     - Stripe (payments/wallet, test mode): `STRIPE_SECRET_KEY`,
       `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`.
     - Maps/routing (OSRM + Leaflet) need **no** key.
3. **OAuth redirect URIs** — if Google is enabled, add the Vercel preview + prod callback URLs in
   Google Cloud (`https://<domain>/api/auth/callback/google`).
4. **Deployed URL:** _paste the live `https://<project>.vercel.app` here once deployed, and pin it
   in the team channel._

## Neon (reconcile to main)

Devs work on `dev-1`…`dev-4`; **production runs on `main`.** Before/at deploy:

- Apply the merged migrations to `main` (from `db/migrations/`), not by pushing a dev branch over it.
- Confirm `main`'s schema matches the migrations committed to the repo — the deploy assumes they're
  in sync.
- Keep production `DATABASE_URL` on the **pooled** `main` host.
- **Seed the demo data** on prod (`pnpm db:seed`) — the judged demo needs two populated orgs, their
  admins/employees, and a published ride. The seed is idempotent, so re-running is safe.

## Build

- Command: `next build` (Vercel default; no override needed).
- `@react-pdf/renderer` runs on the **Node runtime** — the ride-receipt route
  (`app/api/report/receipt/[tripId]/`) sets `runtime = "nodejs"` and the package is in
  `serverExternalPackages` (`next.config.ts`). Keep any new PDF route on Node.
- Output: standard Next.js (no custom output mode).

## Pre-deploy checklist

Run before every push to `main` / integration checkpoint. Run the `qa-verify` skill first.

- [ ] `pnpm typecheck` passes (strict, zero errors).
- [ ] `pnpm lint` passes.
- [ ] `pnpm build` succeeds locally.
- [ ] Migrations generated, **SQL reviewed**, and committed; `main` reconciled.
- [ ] All required env vars set in Vercel (and any newly-added ones).
- [ ] Sign-in works on the deployed URL (credentials at minimum).
- [ ] The **full demo loop** clicks end-to-end on the deployed URL: offer → find & book → start →
      track live + chat → complete → pay from wallet → history → analytics.
- [ ] **Stripe webhook** verified against the deployed URL (not localhost) — `payment.status`
      updates on the live endpoint. PDF receipt renders on the live URL.
- [ ] **Pusher** live tracking + chat work on the deployed URL (or the polling fallback does).
- [ ] Cross-org isolation holds: an Org A admin hitting an Org B record by id gets **404**.
- [ ] No secrets committed (`.env.local` git-ignored).
- [ ] Deployed URL is green and shared in the team channel.

## Carpooling deploy notes

- **Stripe webhook** — register `https://<domain>/api/stripe/webhook` in the Stripe dashboard
  (test mode), copy the signing secret into `STRIPE_WEBHOOK_SECRET`. Serverless webhooks differ from
  local — test on the deployed URL early (PRD §12 risk).
- **Pusher** — a single app (free tier) serves both tracking and chat. If it wobbles, the
  4-second-polling fallback keeps the demo alive (`docs/decisions.md` ADR-010).
- **OSRM** — the public demo server can rate-limit; route geometry is cached on the `ride` row to
  soften this. Note self-host for production. No env var needed.
- **Node-runtime routes** — the Stripe webhook and the PDF receipt run on the Node runtime; keep
  them off the Edge runtime.

Log any further deploy decision as an ADR in `docs/decisions.md`.
