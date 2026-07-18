# Deployment

**When to use this:** getting or keeping the app green on Vercel, and the integrator's hourly merge +
deploy checkpoint. The deploy rule outranks everything: **reviewers can arrive at any hour — the
deployed URL stays working and demoable at every checkpoint. A red deploy outranks any feature; fix it
first, always.**

```
Get the app deployed and green on Vercel (or: run the integration merge + deploy checkpoint). The live
URL must stay working and demoable — a red deploy outranks every feature.

PRE-DEPLOY GATE (must all pass locally first — a broken build never gets pushed to main):
  pnpm typecheck && pnpm lint && pnpm build

BUILD-BREAKERS specific to this stack — check these when the Vercel build fails:
- Env vars: every var the app needs at build/runtime must be set in the Vercel project, not just in
  .env.local. Cross-check against .env.example (DATABASE_URL, AUTH_SECRET / NEXTAUTH_SECRET, Neon,
  Resend, UploadThing, etc.). A missing required var fails the build or 500s at runtime.
- Neon connection string: use the POOLED (-pooler) host. Vercel serverless exhausts direct connections
  — you discover this at hour 20 under demo load, so verify it now.
- Migrations: main's schema must be migrated before the deploy serves traffic. Never migrate main from
  a feature session — it happens at the integration sync point.
- Server/Edge boundary: middleware stays Edge-safe (cookie-presence only; no auth stack imported). Node
  APIs in an Edge context fail the build.
- The PDF pipeline (@react-pdf/renderer) is pure JS and runs on serverless — no headless browser, no
  custom runtime needed. If someone added a browser-based PDF path, that's the break.

THE INTEGRATION CHECKPOINT (integrator only — the hourly ritual):
  :50  everyone commits + pushes their branch, whatever state (broken is fine — say so)
  :52  merge in slice order; run `pnpm build` after EACH slice. A slice that breaks the build gets
       bounced back with the error — it does NOT block the other three.
  :58  push main, confirm Vercel is green, post the status line
  :00  everyone pulls main before writing another line
  Only the integrator touches shared files (db/schema/index.ts, nav/dashboard/homepage configs, root
  layout) — the PreToolUse hook enforces it.

POST-DEPLOY SMOKE TEST (every checkpoint): load the live URL, sign in, click the core demo path end to
end, confirm no console errors and no 500s. Seeded demo data should make the app look populated to a
reviewer arriving cold. If anything is red, STOP and fix it before any feature work resumes.

REPORT the deploy line: DEPLOY: <green | red + live URL state>.

CONTEXT: {{what changed / which slices are merging / the symptom if the deploy is red}}
```

## Notes — check in the output

- **Green gate ran locally first** (`typecheck && lint && build`). Nothing broken should reach main.
- **Env vars are set in Vercel**, cross-checked against `.env.example` — not just present locally. This
  is the most common cold-deploy failure.
- **Pooled Neon host** (`-pooler`). A direct host will fall over under demo load.
- **Merge order respected, build after each slice**, and a breaking slice was bounced — not allowed to
  block the others or, worse, merged red.
- **Live URL smoke-tested**: sign in, run the demo path, no console errors, populated by seed data.
- **Red outranks features.** If the deploy is red, the report should show feature work halted until it's
  green.
