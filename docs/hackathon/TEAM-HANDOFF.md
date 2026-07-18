# TEAM HANDOFF — read before 9:30 tomorrow

**Post this in the team channel tonight.** Two slices can be claimed before anyone sleeps.

The repo is already built. Auth, RBAC, the dashboard shell, a generic DataTable, generic CRUD, forms, notifications, activity log, PDF, email, uploads, and seed data all exist and are tested. **It is already deployed and green.** Nobody scaffolds anything tomorrow — you adapt what's there.

---

## FILL THESE IN TONIGHT (lead)

| | Value |
|---|---|
| **Repo** | `________________________________` |
| **Live URL** | `________________________________` |
| **Design driver** | `________________________________` (takes Slice C or D — Claude Design spends *their* Claude Code budget) |
| **Rehearsed Remix prompt** | `________________________________` (exact working text from TODAY.md Part C step 7) |

---

## 1. Get running — do this TONIGHT, not at 9:30

Twenty minutes now buys you a clean 10:00 start.

```bash
git clone <repo> && cd <repo>
pnpm i
cp .env.example .env.local        # lead sends real values via password manager
pnpm dev                          # must boot with zero errors
pnpm db:seed                      # demo users at every role
```

Then, non-negotiable:
- **`claude update`** — design-sync and the plugins need a current build
- Open Claude Code in the repo → ask **"what skills do you have?"** → expect **seven**. If not, stop and tell the lead. The skills are what keep four independent sessions producing compatible code.
- Log in as each seeded role. Click around. **Open `features/_demo/`** — that's the template you'll copy tomorrow. Ten minutes reading it saves an hour.
- Create your Neon branch: `dev-1` … `dev-4`. You migrate against *your* branch, never main.

## 2. Claim your slice

**C and D are claimable tonight** — they're ~80% domain-independent because the generic tables already exist. Claim now, start at 10:00 sharp with zero deliberation. **A and B are assigned at ~10:00** by the lead, once the domain is known.

| Slice | What | Domain-dependent? | Claim |
|---|---|---|---|
| **A** | Primary domain entity + the core workflow | 100% — this *is* the product | 10:00, lead assigns |
| **B** | Secondary workflow / approval chain + notifications | 100% | 10:00, lead assigns |
| **C** | Admin · settings · user management · activity-log viewer · RBAC surfaces | ~20% | **Tonight** |
| **D** | Analytics/reports · PDF · support tickets · demo seed | ~20% | **Tonight** |

**How to pick:**
- **A** goes to whoever is fastest at unfamiliar domain logic. It's the heaviest and the most judged — it's what a reviewer clicks first.
- **B** goes to whoever is best at cross-cutting seams. It touches A's entities and owns the approval chain, so it's the most coupled.
- **C** goes to whoever wants a clean, self-contained slice. Mostly generic tables, mostly known shape.
- **D** goes to your **design driver**. It's the lightest at 10:00 (the PDF pipeline and support flow already exist; charts wait on data), which leaves room for Claude Design. Analytics ramps up at hour 4 — by which time Design is done.

**C and D: what you can build at 10:00 with zero domain knowledge**
- **C** — activity-log viewer (the table exists), settings CRUD (`systemSetting` exists), user management + role assignment, the admin route group and its nav entries. That's most of your slice, buildable before the schema even lands.
- **D** — support ticket flow (`supportTicket` exists), the PDF pipeline against real data once A's entity lands, seed data for the demo. Charts come at hour 4 once entities have rows.

**C and D: what you absorb at 10:00** — which entities you chart, which artifact D renders as PDF, which resources C administers. The lead prints this in Prompt 1 Step 6.

## 3. Rules that aren't negotiable

**Your slice is yours end to end** — schema, API, business logic, UI, tests. Nobody waits on anyone else's layer.

**Files you must NOT touch.** A `PreToolUse` hook blocks these; that's not a bug:
- `db/schema/index.ts` (the barrel)
- root layout
- `nav.config.ts`, `dashboard.config.ts`, `homepage.config.ts`
- `CLAUDE.md`

Need a nav entry or a barrel export? **Ask the integrator at :50.** Editing it yourself is how last year's merge conflicts started.

**Copy, don't invent.** `features/_demo/` is a complete working CRUD slice. Copy it. Rename it. The `generic-crud` skill will walk you through wiring it. A hand-rolled list screen is a hand-rolled bug.

**Every route starts with `requirePermission(resource, action)`.** Never an inline role check. Every mutating route ends with `logActivity`. The `rbac-guard` skill enforces this.

**One Zod schema per entity**, imported by both the API route and the form. Never two copies — they drift, and the drift surfaces at hour 14 as validation that passes on the client and fails on the server.

**One file per table** under `db/schema/`. Migrate against your Neon branch, never main.

**The skills know all of this.** They auto-load. Don't fight them — if `design-standards` rejects your gradient, it's right, and `docs/design-standards.md` has the reasoning.

## 4. Definition of done

Not "it works." Not "it compiles." This:

- [ ] Schema migrated and merged
- [ ] Full CRUD through the API
- [ ] Zod validation on every input
- [ ] RBAC guarded at **API and UI** — a hidden nav item is not authorization
- [ ] Loading / skeleton / empty / error / success on **every** screen (an empty state is not a blank div)
- [ ] Responsive — verified at **375px** and 1440px
- [ ] Happy path **and one edge case** manually tested through the real app
- [ ] **RBAC negative test:** the wrong role is refused **at the API**, hitting the endpoint directly
- [ ] `docs/api.md` + `docs/database.md` sections filled
- [ ] No console errors
- [ ] Merged to main

Before you hand off: `pnpm typecheck && pnpm lint && pnpm build`, then **`/verify`** — watch it actually work in the running app. The `qa-verify` skill has the full contract.

**"Looks right" is not a test result.** A feature you can't produce evidence for isn't done, and QA will bounce it.

## 5. The hourly merge ritual — 10 minutes, on the clock

| Time | You |
|---|---|
| **:50** | Commit + push your branch. Whatever state. Broken is fine — say so. |
| **:52–:58** | Integrator merges in slice order, `pnpm build` after each. Breaks the build? Bounced back with the error — you keep working, fix it next cycle. |
| **:00** | **Pull main before writing another line.** |

- A branch never outlives one cycle. Can't merge in one? It was too big. Split it.
- **Bounced ≠ blocked.** Keep building.
- Never "I'll merge at the end." That is exactly what stalled this team last year.

## 6. Status format — use it every time you report

```
AGENT:    <your name>
SLICE:    <A | B | C | D>        TIME: <hh:mm>   HOUR: <n/24>
DONE:     <shipped since last report>
TESTED:   <evidence: commands run, flows exercised, edge case, RBAC negative case, widths>
BLOCKED:  <blocker + what you need + from whom — or "none">
NEXT:     <single next action>
```

## 7. Things that will cost you time if nobody says them out loud

- **Reviewers arrive at any hour of the 24.** The deployed URL stays working and demoable at every checkpoint. A red main outranks your feature — always.
- **Feature freeze at hour 12.** Not a suggestion. Hours 12–24 are testing, polish, deploy, docs, and reviewer prep. Last year's team was still writing features at hour 20 and shipped neither.
- **`docs/reviewer-prep.md` is gitignored and updated as you go**, not at hour 20. After each merged slice: what it does, why this design, the trade-off you took, what you'd do with more time. Two sentences each. The `reviewer-doc` skill triggers on this. Written at hour 20 it becomes fiction — nobody remembers why they chose something at hour 3.
- **The type system is locked** — Space Grotesk / IBM Plex Sans / IBM Plex Mono. Synced and published to Claude Design. Don't "improve" it; you'd desynchronise the design system.
- **The accent is the only colour that changes**, once, at ~9:35. Don't add a second one.
- **Don't build past your slice.** If you find yourself editing another slice's files, stop — you've found a seam, and the lead named an owner for it in `docs/team-ownership.md`.
