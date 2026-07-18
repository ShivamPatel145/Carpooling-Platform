# TODAY — July 17, Phase 0 (solo)

You're doing tonight alone. The whole trick is: **give Claude the two keys it needs, start it, then do the remaining accounts while it works.** Don't sit and watch it scaffold.

Realistic: **~4.5 hours.** Most of it is Claude working, not you.

---

## The three things that will bite you if you skim

**1. `/design-sync` is not the last step — the "Published" toggle is.** Synced-but-unpublished means every Claude Design project silently falls back to the **default aesthetic**, which is exactly the generic AI look `CLAUDEwebdesign.md` exists to prevent. Your `claude-skills-and-design-guide.md` never mentions this toggle.

**2. Claude Design has no separate usage allowance any more.** Your guide says it does. It doesn't — it draws from **the same pool as Claude Code**. Tomorrow, whoever drives Design spends their own build budget on it. Verified today: https://support.claude.com/en/articles/14604416-get-started-with-claude-design

**3. Sync runs Code → Design, and it runs tonight.** Design → Code is a *handoff* (an Export option), not `/design-sync`. If you open Claude Design before syncing, it has no idea your components exist.

Also stale in your guide: Claude Design is **beta** now, not research preview (so the Anthropic Labs toggle path is gone — default-on for Pro/Max/Team). Exports now include **Vercel**. Still no Figma or PNG.

---

## The design call, already made

| | Decision | Why |
|---|---|---|
| **Type** | Space Grotesk (display) · IBM Plex Sans (body) · IBM Plex Mono (data) | Locked tonight. Your register — professional B2B tool — is domain-*independent*, so this isn't a bet. And deferring wasn't neutral: shadcn defaults to Inter/system-ui, which §1 explicitly bans. |
| **Neutral base** | shadcn's, untouched | Not banned. A confident neutral. The correct placeholder. |
| **Accent** | One placeholder token → decided at 9:30 | The only genuinely domain-derived colour. One line tomorrow. |
| **Screens, hero, composition** | 9:30 | Pure domain. Can't happen tonight, shouldn't. |

**Reviewer answer for the type system:** Plex Sans is designed for dense UI, Plex Mono aligns numerals in the DataTable, Space Grotesk gives headings personality without shouting.

**"Professional" ≠ generic.** §7 wants clean and minimal; §0 says if a stranger glances for two seconds and thinks "an AI made this," you failed. §5 resolves it: *minimal directions need precise spacing and detail.* Restraint executed precisely.

---

## STEP 1 — Folder + skills (5 min)

```bash
cd ~/your-folder
unzip ~/Downloads/hackathon-pack.zip

mv hackathon-pack/.claude .            # skills MUST sit at repo root
mkdir -p docs/hackathon
mv hackathon-pack/*.md docs/hackathon/
rm -rf hackathon-pack

git init && git add -A && git commit -m "chore: hackathon pack + skills"
```

Restart Claude Code, then ask **"what skills do you have?"** — expect seven. If not, fix it now; everything downstream assumes they're live.

**Why skills before scaffold:** `design-standards` must be active while Claude writes the Block 4 tokens and Block 5 shell. Those exact files get synced tonight.

## STEP 2 — Only two keys (10 min)

Claude gets through Block 1 with nothing and hits a wall at Block 2. So do only these:

```bash
npx auth secret                        # → AUTH_SECRET
```
- **Neon** → new project → copy the **pooled** (`-pooler`) string → `DATABASE_URL`
- **GitHub** → new repo → `git remote add origin ...`

Both into `.env.local`. Everything else comes later, while Claude works.

## STEP 3 — Start Claude (then walk away)

Paste this prefix, then **Part A below**:

```
This folder is NOT empty. It already contains .claude/skills/ and docs/hackathon/.
Scaffold around them — if create-next-app refuses because the directory isn't empty,
scaffold into a temp subdirectory and move files up. Never delete .claude/ or docs/.
.env.local has DATABASE_URL and AUTH_SECRET only. When you hit a block needing a key I
haven't given you, ASK me for it and keep working on what you can. Never stall.
```

That prefix exists because `create-next-app` refuses to run in a non-empty directory and will otherwise stop you dead thirty seconds in.

## STEP 4 — While Claude scaffolds (~2 hrs), you do the rest

Vercel (link repo, add env vars) · Resend (key, or accept `onboarding@resend.dev`) · UploadThing (token) · **Google OAuth — add `http://localhost:3000` + your Vercel preview & prod URLs as redirect URIs now**; console propagation delay is a classic 9:45 AM time sink.

Feed keys to Claude as it asks. Also: `claude update` (design-sync needs a current build).

---

# PART A — the Phase 0 prompt

```
You are the lead technical architect for a 4-person team competing in the Odoo x KSV
Hackathon Final Round. Today is prep day. The problem statement is revealed tomorrow at
9:30 AM — it is UNKNOWN, and you must not guess at it. Build only what is domain-agnostic.

Scaffold this repo end-to-end. Work in order. Verify each block before moving on.

═══ LOCKED STACK — do not substitute anything ═══
Next.js 15 (App Router) · React · TypeScript · Tailwind · shadcn/ui · Framer Motion ·
React Hook Form + Zod · TanStack Query · PostgreSQL on Neon · Drizzle ORM + drizzle-kit ·
Auth.js + custom RBAC · UploadThing · Resend + React Email · pnpm · Vercel · Git/GitHub

We deliberately reject the reference repo's Prisma / Better-Auth / SWR. Patterns transfer;
libraries do not.

═══ BLOCK 1 — Init ═══
pnpm-based Next.js 15 + TypeScript. Wire every library above. Strict TS.
Scripts: dev, build, start, lint, typecheck, db:generate, db:migrate, db:studio, db:seed.

═══ BLOCK 2 — Database ═══
Drizzle against Neon via the pooled connection string.
CRITICAL: one file per table under db/schema/<table>.ts, re-exported from a single barrel
db/schema/index.ts. Never one large schema file — four people add tables in parallel
tomorrow and must not touch the same line. This is the single most important convention in
the repo.
Every table: id (uuid, defaultRandom), createdAt, updatedAt.
Pre-build these domain-agnostic tables (they recur in every ERP-style statement):
  user (with role) · notification · activityLog (actor, action, resource, resourceId,
  metadata, ip) · systemSetting (key/value) · supportTicket · demoEntity
demoEntity lives in features/_demo/ and proves the CRUD pattern end-to-end. Tomorrow it's
the copy template for all four slices. Make it genuinely complete, not a stub.
Generate + run the first migration. Confirm db:studio opens.

═══ BLOCK 3 — Auth & RBAC ═══
Auth.js: credentials + Google. Role field on user.
lib/permissions.ts, this exact shape (adapted from the reference repo, re-implemented on
Auth.js — do NOT use better-auth's access-control plugin):
  - a single source-of-truth statement object: resource -> allowed actions
  - per-role permission sets derived from that statement
  - a numeric roleHierarchy
  - canX(role, ownerId, userId) helpers for ownership-scoped access
  - requirePermission(resource, action) called by every route — never inline role checks
Edge-safe middleware: session-cookie presence only. Full role/session validation in server
components. Never import the auth stack into the Edge runtime.

═══ BLOCK 4 — Design tokens (BEFORE any UI) ═══
Read docs/design-standards.md first (Block 9 creates it — create that file NOW if missing).
Its hard bans are absolute and override your defaults.

The domain is unknown, so this block deliberately decides LESS than it could.

LOCKED — the type system. Register is "professional B2B tool, dashboard-first", which is
domain-independent, so this is not a bet:
  Display: Space Grotesk    (headings — personality without shouting)
  Body:    IBM Plex Sans    (dense UI; forms, nav, long copy)
  Data:    IBM Plex Mono    (numerals + IDs in the DataTable — §3's third utility face)
next/font/google, font-display: swap, real fallbacks. Explicit scale: sizes, weights,
line-heights, letter-spacing. Headlines tight; body 1.5–1.7. Tabular numerals on the mono.
Raw Inter/system-ui as the entire type system is BANNED by §1 — that's exactly what shadcn
defaults to, so this block is what stops us syncing a violation to Claude Design tonight.

LOCKED — spacing scale, radii, motion durations/easings. Domain-agnostic craft.

DELIBERATELY OPEN — the palette:
  Keep shadcn's neutral base. It is not banned, it is a confident neutral, it is the correct
  placeholder. Do NOT invent a palette tonight.
  Export the accent as ONE named token `accent` with a deliberate neutral placeholder value.
  Tomorrow the domain sets it; it is the ONLY colour that changes. Structure the file so the
  swap is one line, and leave a comment saying exactly that.
  No purple/violet. No gradients. Ever.

Verify WCAG AA (4.5:1 body, 3:1 large) with the placeholder, so tomorrow's swap can't
silently break contrast.

These exact files get synced to Claude Design tonight. Defaults here become defaults in
every design tomorrow. Do not skim this block.

═══ BLOCK 5 — Shell & primitives ═══
Dashboard shell: sidebar + top nav, responsive, role-aware nav driven by a CONFIG ARRAY
(nav.config.ts) — adding a nav item must be a data change, not a layout edit.
Dark mode. Global providers: theme, QueryClient, toast, session.
Reusable data-state primitives as components, not per-page one-offs: skeletons, loading,
empty, error, success toast, status badge.
A generic <DataTable>: search + column filters + pagination, parameterized by entity.

═══ BLOCK 6 — Generic CRUD & forms ═══
CRUD pattern (list/create/edit/delete) parameterized by entity, on RHF + Zod + TanStack
Query. ONE Zod schema per entity, imported by BOTH the API route and the form — never two
copies. Reusable form primitives on shadcn/ui: input, select, date picker, file upload.
Prove it: full CRUD for demoEntity in features/_demo/.

═══ BLOCK 7 — Shared foundation ═══
Typed API wrapper + consistent error-handling wrapper for route handlers · logger
(structured; no external observability stack) · email utility on Resend + React Email with
one generic notification template ready to duplicate · UploadThing utility · PDF scaffold
using @react-pdf/renderer (pure JS, Vercel-safe, no headless browser) rendering a
placeholder invoice — invoice/report generation is a near-universal requirement in this
competition · shared components/hooks/utils/types folders structured for four slices.

═══ BLOCK 8 — Config ═══
.env.example covering every variable the scaffold introduces, each with an inline comment:
DATABASE_URL (Neon pooled), AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET,
RESEND_API_KEY, UPLOADTHING_TOKEN, NEXT_PUBLIC_APP_URL.

═══ BLOCK 9 — Docs ═══
docs/design-standards.md  ← paste the full contents of CLAUDEwebdesign.md here verbatim.
  Do NOT inline it into CLAUDE.md; that file loads every turn across four sessions all day.
docs/wireframe/           ← create the DIRECTORY + a README.md saying "ODOO wireframe lands
  here at ~9:33 on July 18." The wireframe arrives tomorrow. Do not invent one.
Skeletons with real placeholder structure, not empty files: overview.md · architecture.md ·
database.md · api.md · folder-structure.md · team-ownership.md · environment-setup.md ·
deployment.md · decisions.md (running ADR log)
docs/reviewer-prep.md — placeholders for: product decisions, architecture, database design,
security/RBAC, scalability, performance, engineering trade-offs, UI decisions, future
improvements. ADD TO .gitignore so it never appears in the repo reviewers browse.

═══ BLOCK 10 — CLAUDE.md skeleton ═══
Facts and conventions ONLY — stack, folder conventions, coding standards, commands, how
CRUD/forms/RBAC are used. Link to docs/design-standards.md, don't inline it. Procedures
belong in .claude/skills/. This file costs tokens every turn in four sessions.
Leave clearly marked TODO slots for tomorrow: domain, final schema, ownership map,
project-specific conventions.

═══ BLOCK 11 — Prompt library ═══
/prompts, one template per category, parameterized with {{entity}}, {{role}}, {{feature}}:
project-understanding · architecture · database · ui · apis · authentication · validation ·
crud · analytics · notifications · documentation · testing · bug-fixing · refactoring ·
deployment · reviewer-preparation

═══ BLOCK 12 — Seed ═══
db:seed producing demo users at every role + populated demoEntity rows. Reviewers arrive at
any hour tomorrow; an empty app reads as unfinished. Seed data is demo infrastructure.

═══ VERIFY BEFORE REPORTING ═══
Do not say this is done until you have actually run:
  1. pnpm typecheck && pnpm lint && pnpm build — clean
  2. pnpm dev — boots, zero console errors
  3. Sign up + log in via credentials AND Google
  4. A protected route BLOCKS the wrong role — tested AT THE API, not a hidden nav item
  5. Full CRUD on demoEntity through the real UI; search + filter + pagination work
  6. One email sends; one file uploads; the placeholder PDF renders
  7. Renders correctly at 375px and 1440px
  8. The design-standards vibe-code checklist — every item NO

Then report in exactly this format, nothing else:

  DONE:    <what exists now, one line each>
  TESTED:  <commands run and flows exercised — evidence, not claims>
  BLOCKED: <blocker + what you need from me, or "none">
  NEXT:    <single next action>

Start now. Ask me nothing you can decide yourself.
```

**Scope discipline:** the shell is a bet placed before seeing the wireframe. A safe one — sidebar + top nav is near-universal here, and Odoo's own backend follows it. Hedge it cheaply: **build the shell and primitives, nothing beyond them.** No speculative screens, no guessed dashboards. If the wireframe contradicts the chrome tomorrow you adapt the chrome and keep every primitive — but only if you didn't build past them.

---

# PART B — plugins + hook (~15 min)

```bash
/plugin install typescript-lsp@claude-plugins-official
/plugin install github@claude-plugins-official
/plugin install vercel@claude-plugins-official
/plugin install security-guidance@claude-plugins-official
/plugin install commit-commands@claude-plugins-official
/plugin install pr-review-toolkit@claude-plugins-official
pnpm add -g typescript-language-server        # typescript-lsp needs the binary

/run-skill-generator                          # once the app boots — so /run and /verify
                                              # behave identically in all four sessions
```

**Shared-file guard hook** — turns the merge-conflict convention into something that can't be violated under time pressure. Verify the schema against `/hooks` first:

```json
{ "hooks": { "PreToolUse": [ { "matcher": "Edit|Write",
    "hooks": [{ "type": "command", "command": ".claude/hooks/check-shared-file.sh" }] } ] } }
```

Script exits non-zero for `db/schema/index.ts`, root layout, `nav.config.ts`, `CLAUDE.md` — printing "route this through the integrator."

---

# PART C — design system sync (the long pole, ~45 min)

Start the moment Block 5 renders. **Extraction is capped by source quality** — that's why it waits for a clean shell, and why it can't wait until midnight.

**1. Enter the right org.** claude.ai/design → lower-left of the project picker → click the org name → select/create your team org → onboarding. Projects only inherit the design system while you're in that org.

**2. Sync.** In Claude Code, repo root:
```
/design-sync
```
It analyzes your component library, diffs against the remote, and **presents a plan** before writing. Read it.

**3. Feed it more than code.** One source works; several are better. Add `docs/design-standards.md` and a screenshot of the rendered shell. *(No wireframe — that arrives at 9:30 and it's project context, not design-system material. Nothing here waits on it.)*

> Official tip that matters: *"Include real examples, not just specs."* Your rendered shell beats your token file.

**4. Review the extraction:**
- [ ] Type is **Space Grotesk / IBM Plex Sans / IBM Plex Mono** — not Inter. **The #1 thing to check.**
- [ ] Neutral base came through; no purple/violet anywhere
- [ ] Your components came through **with your names** — DataTable, shell, status badges, the empty/loading/error states
- [ ] Spacing/radii match `lib/design-tokens.ts`
- [ ] The placeholder accent is one distinct token

Wrong? Don't re-sync blindly — upload different assets and re-extract.

**5. ⚠️ FLIP "Published" ON.** The step everyone misses. Unpublished = every project silently falls back to the default aesthetic.

**6. Throwaway test project — tonight, not at 9:31.**
```
Create a landing page for a generic B2B operations tool.
```
Confirm **your** type, **your** neutral, **your** components. If it comes back cream-and-terracotta, near-black-with-neon, or hairline-rule broadsheet — that's the documented default aesthetic, meaning publish didn't take. Fix it now.

**7. ⚠️ Rehearse the accent Remix — not optional for you.**

You deferred the palette to 9:30, so someone performs a live design-system change during a 30-minute window. Rehearse it once:

- org settings → **Open** next to the design system → **Remix** (upper right) → chat opens left
- Prompt: `Change the accent colour to #0F766E. Leave the type system and neutral base untouched.`
- **Time it.** Confirm the type system survives.
- Regenerate a screen and confirm the new accent lands.

Now it's a known ~4-minute op at 9:33 instead of an unknown. **If Remix mangles the type system rather than just the accent — find that out tonight** and fall back to re-running `/design-sync` after the one-line token change (the second sync diffs, so it's fast).

**Write the exact working Remix prompt into `TEAM-HANDOFF.md`.** You won't be the one running it tomorrow — you'll be running the 9:30 window.

**8. Delete the throwaway.**

**Optional — MCP server**, if your design driver prefers the terminal:
```bash
claude mcp add --scope user --transport http claude-design https://api.anthropic.com/v1/design/mcp
/design-login
```

---

# PART D — verification gate + deploy

- [ ] Fresh clone elsewhere: `pnpm i && pnpm dev` boots, zero errors
- [ ] Auth works both ways; protected route blocks the wrong role **at the API**
- [ ] CRUD + table search/filter/paginate work on demoEntity
- [ ] One email, one upload, one PDF
- [ ] **Deploy to Vercel. Load the live URL.**
- [ ] `/design-sync` done, **published**, throwaway confirmed your components, **Remix rehearsed and timed**
- [ ] `docs/wireframe/` exists, empty, with README
- [ ] `TEAM-HANDOFF.md` filled in (see below)
- [ ] Everything pushed to main

**If only one thing gets done tonight: the Vercel deploy.** Late integration is what stalled you last year. A green URL at hour zero is the cheapest insurance available.

---

# PART E — before you sleep, fill in TEAM-HANDOFF.md

Three teammates arrive tomorrow having never seen this repo. `TEAM-HANDOFF.md` is what makes them productive at 10:00 instead of 11:00. Fill its four TONIGHT slots:

1. **The live Vercel URL + repo URL**
2. **The rehearsed Remix prompt** (exact working text, from Part C step 7)
3. **Name your design driver** — the teammate taking the lightest slice. Not you (you're the integrator), not your heaviest builder. Claude Design spends *their* Claude Code budget.
4. **Confirm Slices C and D are claimable tonight** — they're ~80% domain-independent. Post the doc in your team channel now and let two people claim before they go to bed. That's two developers starting at 10:00 sharp with zero deliberation.

---

## Solo timeline

| Slot | You | Claude |
|---|---|---|
| 0:00–0:15 | Folder, skills, verify 7 skills load, 2 keys | idle |
| 0:15 | Paste prefix + Part A | **Blocks 1–3** |
| 0:15–1:00 | **Vercel · Resend · UploadThing · Google OAuth** | Blocks 1–3 |
| 1:00–2:15 | Feed keys as asked. Skim Block 4 output — it gets synced. | Blocks 4–7 |
| 2:15–2:45 | Part B: plugins, hook, `/run-skill-generator` | Blocks 8–12 |
| 2:45–3:30 | **Part C: sync → publish → test → rehearse Remix** | idle |
| 3:30–4:00 | Part D verification gate | fixes |
| 4:00–4:15 | **Deploy. Push.** | — |
| 4:15–4:30 | Part E: fill TEAM-HANDOFF, post to channel | — |
| then | Sleep. Four tired developers stalled this team last year as surely as merge conflicts did. | |
