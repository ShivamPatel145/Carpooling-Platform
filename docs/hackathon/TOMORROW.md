# TOMORROW — July 18

Three prompts, in order. The spine is: **schema decided → pushed → four people build in parallel → merge every hour.** Everything below serves that.

| Time | Who | Does |
|---|---|---|
| 9:30 | **You (lead/integrator)** | Prompt 1 — pick, schema, roles, slices |
| 9:30 | **Design driver** | Wireframe → `docs/wireframe/` → **push by 9:33** → Remix → Prompt 2 |
| 9:30 | **Slices C + D** | Already claimed last night. Read `TEAM-HANDOFF.md`, clone, boot. |
| ~10:00 | **You** | Push the schema. **This is the one hard sync point.** Then Prompt 3. |
| 10:00+ | **Everyone** | Build. Merge on the hour, every hour. |

Don't serialize these. 30 minutes won't take it.

---

# PROMPT 1 — 9:30 AM, Claude Code (lead session)

Fill `{{PROBLEM_STATEMENT}}`. Nothing else.

```
You are the lead architect for our 4-person team in the Odoo x KSV Hackathon Final Round.

Phase 0 is COMPLETE. This repo has: the locked stack (Next.js 15 / TS / Tailwind / shadcn /
Framer Motion / RHF+Zod / TanStack Query / Drizzle+Neon / Auth.js + lib/permissions.ts RBAC /
UploadThing / Resend / pnpm / Vercel), the role-aware dashboard shell, generic CRUD +
DataTable + form primitives, the design token system (type LOCKED: Space Grotesk / IBM Plex
Sans / IBM Plex Mono; accent is a placeholder), generic tables (user, notification,
activityLog, systemSetting, supportTicket), a complete demo entity in features/_demo/,
email/upload/PDF utilities, seed data, /prompts, .claude/skills/, CLAUDE.md. The design
system is synced and PUBLISHED to Claude Design. It is deployed and green on Vercel.

Read CLAUDE.md and docs/folder-structure.md NOW, before anything else.
DO NOT re-scaffold, re-install, or rebuild any of the above. Adapt what exists.

PROBLEM STATEMENT(S):
─────────────────────────────────────────
{{PROBLEM_STATEMENT}}
─────────────────────────────────────────

30 minutes total. Every step's job is to unblock four people, not to be finished.
Speed over completeness. Decide, don't ask.


━━━ STEP 1 — AMBIGUITY CHECK (2 min, FIRST) ━━━
Scan for ambiguity that changes ARCHITECTURE — unclear roles, unclear core workflow,
undefined data ownership, scope that could double the build. Ignore cosmetic ambiguity.

If anything qualifies: ONE short message listing each ambiguity with YOUR RECOMMENDED
DEFAULT beside it. Then CONTINUE IMMEDIATELY on those defaults. Do not wait for my reply.
If I disagree I'll interrupt.

Never stall here. A wrong default corrected at 9:45 costs five minutes; a stall costs the
window.


━━━ STEP 2 — SELECT & COMMIT (4 min, skip if only one statement) ━━━
Score each on: real business value · innovation potential · how well it demonstrates
ENGINEERING quality (that's what's judged, not feature count) · feasibility against a
~12-hour core-build budget for 4 devs · differentiation (a feasible statement most teams
skip beats the obvious crowd-pleaser — but differentiation NEVER outranks feasibility).

Output exactly:
  CHOSEN: <statement>
  WHY:    <one line>
  RISK:   <biggest risk + mitigation>

Commit. No revisiting, whatever looks appealing at hour 6.


━━━ STEP 3 — MAP TO PRE-BUILT ASSETS (4 min) ━━━
For EVERY core requirement, name the existing asset or mark it NEW:

  | Requirement | Existing asset | Adaptation | NEW? |

Available: generic CRUD · DataTable · lib/permissions.ts RBAC · notification · activityLog ·
supportTicket · PDF pipeline · Resend email · UploadThing · shell + nav config · data-state
primitives · design tokens · seed infrastructure.

Every NEW is a cost — justify each in a clause. **If >25% of requirements are NEW, say so
explicitly.** That means you picked the wrong statement in Step 2, and 9:42 is the last
moment changing your mind is cheap.


━━━ STEP 4 — SCHEMA (6 min) — THIS IS THE SPINE ━━━
Everything downstream waits on this. Three developers cannot start until it's pushed.

Follow the drizzle-schema skill. Drizzle table stubs, one file per table under db/schema/,
for the domain entities, relationships, and enums.

Just enough to migrate and unblock four people. NOT a finished design:
  - extend the generic tables by reference; never duplicate their purpose
  - every table gets id/createdAt/updatedAt
  - name the FKs and enums now; nullable-vs-required can be wrong and fixed at hour 2
  - index every FK and every column a list filters or sorts by
  - one Zod schema per entity via drizzle-zod, imported by BOTH the API route and the form

Generate the migration. Don't run it against main yet — Step 8.

Getting this 80% right in 6 minutes beats 100% right in 20. The cost of a wrong column at
hour 2 is one migration. The cost of three developers idle at 10:00 is three developers idle.


━━━ STEP 5 — ROLES & ROUTES (4 min) ━━━
Define this domain's roles (expect ~3–4: admin, approver, a business role, an external role).
Route structure: one top-level route group per role + shared auth routes. Give actual paths.
Extend lib/permissions.ts — new resources and actions into the statement object, per-role
sets, roleHierarchy. Follow the rbac-guard skill.
This is the one shared file that changes now rather than at a checkpoint. You're the
integrator; do it here and ship it in Step 8.


━━━ STEP 6 — SLICES (5 min) ━━━
Two slices are ALREADY CLAIMED and are ~80% domain-independent. Don't redesign them — fit
the domain into them:

  SLICE C — Admin · settings · user management · activity-log viewer · RBAC surfaces
  SLICE D — Analytics/reports · PDF generation · support tickets · demo seed data

Your job is Slices A and B, which are domain-specific:
  SLICE A — the primary domain entity + the core workflow (heaviest; give it your strongest dev)
  SLICE B — the secondary workflow / approval chain + notifications

For each of A and B: the entities it owns, its route group, its API folders, its feature
folder, and the specific files it must NOT touch. Then state what C and D absorb from this
domain (which entities they chart, which artifact D renders as PDF, which resources C
administers).

Call out every CROSS-SLICE SEAM (approval chains, anything spanning two slices) and name
which single slice owns it. Unowned seams are how last year's integration failed.

Output as the literal content of docs/team-ownership.md.


━━━ STEP 7 — DESIGN BRIEF + ACCENT (3 min) ━━━
Our design driver is in Claude Design right now. Fill the blanks in PROMPT 2 of
TOMORROW.md and print the completed brief as ONE copy-pasteable block: domain, a
one-sentence value proposition in REAL words (Claude Design won't invent it), explicit
audience, entities, roles, the screens each role needs.

Then, one line each:
  - which synced components each core screen uses, by name
  - how the wireframe in docs/wireframe/ maps onto them structurally (pushed ~9:33; if it's
    not there yet, say so and continue — do not block on it)
  - THE ACCENT: one hex, derived from this domain, with a one-line reason. This is the ONLY
    colour that changes — the neutral base and type system (Space Grotesk / IBM Plex Sans /
    IBM Plex Mono) are locked, synced, and published. Redesigning them desynchronises the
    design system and burns the window re-syncing.
    Print the exact one-line diff for lib/design-tokens.ts, plus the one-sentence Remix
    prompt for the design driver. They rehearsed this last night — it's a ~4-minute
    operation, not an experiment.
    Register is "professional B2B tool": a disciplined signal colour used sparingly, not a
    brand statement. No purple/violet. No gradients.


━━━ STEP 8 — THE SYNC POINT (2 min) ━━━
Update CLAUDE.md's TODO slots: chosen domain + project name, the schema, the ownership map,
project-specific conventions. Facts only; procedures stay in skills.

Run the migration against main. Commit schema + permissions + CLAUDE.md +
team-ownership.md together. Tell me to push.

Then print, for me to paste into the team channel verbatim:
  - the one-line domain summary
  - who owns which slice (A and B named; C and D confirmed)
  - "pull main NOW before writing any feature code"

This push is the ONE hard synchronization point. Everything after it is parallel.
```

**The moment this finishes: push.** Then each dev creates their Neon branch (`dev-1`…`dev-4`) so parallel schema work can't collide. Branches reconcile at the hourly merges.

---

# PROMPT 2 — ~9:40, claude.ai/design (design driver only)

**Before the brief lands, 9:30–9:40:**
1. Commit the ODOO wireframe → `docs/wireframe/` → **push by 9:33.** Prompt 1 Step 7 and Prompt 3 Step 2 both read that path.
2. Skim it — you're about to tell Claude Design to follow its structure.
3. New project, **inside your org, created after publish** or it inherits nothing.
4. **Attach the wireframe as project context** (wireframes are an explicitly supported context type).
5. Run the rehearsed accent Remix with the value from Prompt 1 Step 7. ~4 min. Prompt is in `TEAM-HANDOFF.md`.
6. Then paste the brief.

```
Build the core screens for a {{DOMAIN}} platform.

AUDIENCE: {{be specific. "Facility operations managers at mid-size sports complexes", not
"businesses". Audience drives tone and visual weight.}}

VALUE PROPOSITION: {{ONE REAL SENTENCE. A placeholder here produces placeholder-shaped design.}}

ROLES: {{Admin · Approver · Operator · External requester}}
ENTITIES: {{the 4-6 core domain objects from the schema}}

SCREENS, IN THIS ORDER:
1. Public homepage — the hero opens with the most characteristic thing about {{DOMAIN}}, not
   a slogan. Real composition: asymmetry, editorial grid, intentional whitespace.
2. {{ROLE 1}} dashboard — {{the 3-4 things this role does daily}}
3. {{ROLE 2}} dashboard — {{ditto}}
4. List screen for {{PRIMARY ENTITY}} with search, filters, pagination
5. Detail/edit screen for {{PRIMARY ENTITY}}
6. {{the domain's signature workflow screen — the approval chain, the booking flow, whatever
   this product is actually FOR}}

USE MY DESIGN SYSTEM — by component name, not approximation: DataTable, the dashboard shell
with sidebar + top nav, status badges, the empty/loading/error states. These exist. Don't
invent parallel versions.

STRUCTURE: follow the attached ODOO wireframe's information architecture. Keep its layout
logic. Replace its styling with my design system.

REGISTER: professional B2B tool. Reads as real SaaS/ERP to someone who builds software for a
living — clean, minimal, dashboard-first. Minimal does NOT mean generic: restraint executed
precisely. Distinctiveness comes from precision, not decoration.

TYPE — locked, already in the design system, do not touch:
Space Grotesk (display) · IBM Plex Sans (body) · IBM Plex Mono (tabular data and IDs).

ACCENT: {{THE ONE DOMAIN-DERIVED COLOUR}}, already Remixed in. Used sparingly as a signal
colour. Neutral base is locked.

HARD BANS — reject on sight, these are not stylistic preferences:
purple/violet/indigo primary · purple↔blue or purple↔pink gradients · gradient-filled
headline words · rows of large meaningless stats · emoji in headings · "Why Choose Us" or
interchangeable SaaS slogans · glassmorphism by default · pill-badge clutter under the hero ·
everything centered in one column · soft drop shadows on every card

RESPONSIVE: 375 / 768 / 1024 / 1440. Every screen.

Start with structure only. No visual polish yet.
```

**Iterate in three passes. Don't skip to polish — a beautiful wrong structure is worse than an ugly right one.**

| Pass | Do | Tool |
|---|---|---|
| 1. Structure | Layout, hierarchy, what's on each screen | **Chat** |
| 2. Content | Real copy, real labels, real data shapes. No lorem. | **Chat** |
| 3. Polish | Spacing, weight, alignment | **Inline comments** for component-level; **direct canvas edit** for quick nudges |

Be specific: *"tighten spacing between form fields to 8px"*, not *"this looks off."* Ask it to critique its own accessibility and contrast — free QA before code exists. Drifting generic? Re-anchor by name: *"Use the Primary Button component."*

| Bug | Fix |
|---|---|
| Comment vanishes | Paste the feedback into chat |
| "Chat upstream error" | New chat tab **inside the same project** |

**Handoff:** Export (upper right) → **Handoff to Claude Code** → local coding agent or Claude Code Web. That output is `{{DESIGN_HANDOFF}}` in Prompt 3.

**Hard stop at 10:00.** Homepage + one dashboard direction is a win. Six polished screens is a loss — you spent build budget on pictures. Design keeps running after 10:00 if your slice allows; **the build does not wait for it.**

---

# PROMPT 3 — ~10:00, Claude Code (lead session)

Fill `{{WIREFRAME}}` → `docs/wireframe/` (confirm it's there) and `{{DESIGN_HANDOFF}}` (accepts *"not yet — proceed on tokens"*).

For background agents: `export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. They cost noticeably more tokens, have no session resumption, and lag on task status — and **Claude Design now draws from the same pool.** The pipeline degrades gracefully to subagents + sequenced phases; the phases are identical either way.

```
ROLE: delivery lead running a multi-agent build pipeline for our Odoo x KSV hackathon
product. CLAUDE.md is final — domain, schema, roles, ownership map committed and pushed.
Phase 0 assets exist and are green on Vercel.

Skills in .claude/skills/ are active. Respect their triggers, especially design-standards
(visual law), rbac-guard (every route), qa-verify (nothing ships untested).

INPUTS
  Problem statement + decisions ... CLAUDE.md (§domain), docs/decisions.md
  Ownership map ................... docs/team-ownership.md
  Structural base ................. {{WIREFRAME}}
  Design direction ................ {{DESIGN_HANDOFF}}
  Visual law ...................... docs/design-standards.md (hard bans absolute)

FEATURE SET — already decided, FIRST-CLASS, not afterthoughts:
  · Role-based auth on lib/permissions.ts, enforced at API AND UI
  · Role-aware dashboard shell with dark mode
  · Full CRUD per domain entity on the generic primitives
  · DataTable with working search/filter/pagination everywhere a list appears
  · Notifications: in-app (notification table) + email (Resend + React Email)
  · Activity log on every mutating action
  · File uploads (UploadThing) where the domain needs documents or images
  · PDF generation for the domain's printable artifact (invoice/report/ticket)
  · Analytics with recharts — use /dataviz for chart forms + a colorblind-safe palette
  · Support/report ticket flow
  · Loading/skeleton/empty/error/success on EVERY screen — the §7 quality bar
  · Seeded demo data so reviewers arriving at any hour see a populated, working app
  · Animated public homepage + every supporting page


━━━ STEP 1 — PROJECT TYPE ━━━
Apply the project-type-picker skill. State the type from [Slides, Prototype, Wireframe,
Document, Animation, Software design, Web design, Résumé, 3D object, Research, HTML email,
Color + type pairing, Diagram, Flier] with a ONE-line justification tied to this statement.
Expected: Web design. Name the secondary types and when: HTML email (Resend templates),
Diagram (ERD + architecture for docs, high value at hour 20), Slides (demo deck, hour 20–22).


━━━ STEP 2 — WIREFRAME ADAPTATION — do not design from scratch ━━━
Read {{WIREFRAME}}. Committed ~9:33 this morning.
If it's absent, thin, or contradicts last night's shell: the shell and primitives stay, the
wireframe's information architecture wins on layout, and you say so in one line rather than
stalling. Never block the build on a reference document.

Produce docs/wireframe-map.md:
  | Wireframe screen/region | Our route | Our shell region | shadcn components | Status |

  - Its INFORMATION ARCHITECTURE is the base. Keep it.
  - Its styling is replaced by lib/design-tokens.ts.
  - Conflicts with a hard ban: STRUCTURE WINS, STYLING LOSES. Log it.
  - Screens the statement makes unnecessary: CUT. Say so. Don't build to honour a reference.
  - Screens the statement needs that the wireframe lacks: mark NEW, derive structure from
    the wireframe's existing patterns, not from your defaults.


━━━ STEP 3 — PAGES & TOKENS ━━━
List every page: public homepage · auth · one dashboard per role · every entity's
list/create/edit/detail · analytics · notifications · settings · support · each
workflow-specific screen. Map each to its owning slice.

Tokens: change ONLY the accent, to the value from Prompt 1 Step 7. One line. Do not redesign
the token system — it's synced and published.

Homepage is a thesis, not a template. Open with the most characteristic thing about this
domain. Per docs/design-standards.md: NO centered slogan + two buttons + stat row, NO
gradient headline words, NO pill-badge clutter, NO "Why Choose Us". Real composition.
Animation: ONE orchestrated Framer Motion load reveal + scroll-triggered section reveals.
Not scattered effects — excess animation is itself a tell. prefers-reduced-motion respected.


━━━ STEP 4 — EXTENSIBILITY CONTRACT — state it, then honour it ━━━
New features must be addable later without a redesign. Document these in
docs/architecture.md as you build; name them to reviewers:

 1. NEW ENTITY = purely additive. features/<entity>/ + db/schema/<entity>.ts +
    app/api/<entity>/ + ONE nav.config.ts entry. ZERO edits to existing feature code.
 2. CONFIG-DRIVEN SECTIONS. nav.config.ts, dashboard.config.ts, homepage.config.ts are
    arrays. Adding a nav item, widget, or homepage section is a DATA change, never a layout
    rewrite. Build them this way from the first commit — retrofitting at hour 18 is a
    redesign.
 3. ROLES/PERMISSIONS extend via the statement object only. A new role is an entry, not a
    conditional.
 4. CROSS-CUTTING CONCERNS (notifications, activity log, uploads, PDF, email) go through
    existing utility interfaces. Never reimplemented per feature.
 5. API SHAPE fixed: app/api/<resource>/ with [id]/, create/, my/, stats/.

If a build decision would violate one of these, escalate before making it.


━━━ STEP 5 — THE PIPELINE ━━━
Agent team; fall back to subagents + sequenced phases if unavailable. Roles identical either
way.

 BUILDER agents (one per slice, per docs/team-ownership.md)
   schema → API + RBAC → business logic → UI on the generic primitives.
   BACKGROUND. Small frequent commits. Branches never outlive one merge cycle.
   MUST self-verify before handoff (qa-verify): pnpm typecheck && pnpm lint && pnpm build
   clean, then /verify or /run to WATCH the feature work in the running app.
   "It compiles" is not a handoff. A builder who hands off untested work has delegated their
   job to QA.

 QA agent (independent — never the builder)
   The builder's claim is the INPUT, not the conclusion. Verify each handoff against:
     · the specific requirement it claims to satisfy
     · happy path + ≥1 edge case (empty input, missing record, boundary) through the REAL app
     · RBAC NEGATIVE TEST — mandatory — the wrong role is blocked AT THE API, not merely
       hidden in the nav
     · the design-standards vibe-code checklist — every item NO
     · 375px and 1440px
     · loading/empty/error/success all present
   /code-review on the diff. /security-review on anything touching auth, RBAC, uploads, or
   personal/financial data.
   REJECT back to the builder with specifics. Never fix silently — a silent fix hides the
   pattern from the next slice.

 INTEGRATOR agent (the only one near shared files)
   Sole owner of: db/schema/index.ts, root layout, nav/dashboard/homepage configs, CLAUDE.md.
   Consistent with the PreToolUse hook.
   Runs the hourly merge ritual (below). After EVERY merge: pnpm build + smoke-test the demo
   path + confirm Vercel green. Reconciles the four Neon branches to main each cycle.
   NON-NEGOTIABLE: reviewers arrive at any hour. The deployed URL stays working and demoable
   at every checkpoint. A red deploy outranks any feature.

ESCALATE ONLY when: (a) a decision changes scope, schema, or conflicts with design law;
(b) a slice is blocked >20 min; (c) a milestone completes. Otherwise stay in the background.
Do not narrate progress at me.


━━━ STEP 6 — ORDER ━━━
 1. Accent token + wireframe map + homepage shell        (unblocks everything visual)
 2. Slices in parallel per the ownership map:
      schema → API + RBAC → UI on generic primitives → self-verify → QA → integrate
    Hour 1 checkpoint: every slice scaffolded (tables migrated, routes skeletoned, empty
    handlers) and merged. Catch conflicts HERE, not at hour 8.
 3. Cross-slice seams after hour 4 — the ones named in docs/team-ownership.md.
 4. FEATURE FREEZE at hour 12. Non-negotiable. Then: QA sweep, polish, deploy hardening,
    docs, reviewer prep. No new features, whatever the temptation.

TRACEABILITY: every requirement traces to exactly one slice. Maintain the trace table in
docs/overview.md. A requirement not in the table is one about to be silently dropped at
hour 20.

ONGOING from hour 1, not deferred: docs/api.md + docs/database.md as each slice lands ·
docs/decisions.md per architecture decision as it's made · docs/reviewer-prep.md per merged
slice (reviewer-doc skill) — gitignored, never committed.


━━━ STEP 7 — STATUS FORMAT ━━━
Every agent. Every surfacing. Nothing outside this shape.

──────────────────────────────────────
AGENT:    <builder-N | qa | integrator>
SLICE:    <name>          TIME: <hh:mm>   HOUR: <n/24>
DONE:     <shipped since last report — one line each>
TESTED:   <evidence: commands run, flows exercised, edge case, RBAC negative case, widths.
           Claims without evidence are not evidence.>
BLOCKED:  <blocker + what's needed + from whom — or "none">
NEXT:     <single next action>
DEPLOY:   <green | red + live URL state>
──────────────────────────────────────

A feature absent from TESTED is not DONE. "Looks right" is not a test result.
Begin.
```

---

# THE HOURLY MERGE RITUAL

You asked for merges every hour. That only works if it's a **timed ritual, not a good intention.** 10 minutes, on the clock, every hour. The integrator runs it.

| Time | Who | Does |
|---|---|---|
| **:50** | Everyone | Commit + push your branch. Whatever state it's in. Broken is fine — say so. |
| **:52–:58** | Integrator | Merge in slice order. `pnpm build` after **each**. A slice that breaks the build gets bounced back with the error — it does **not** block the other three. |
| **:58** | Integrator | Push main. Confirm Vercel green. Post the status line. |
| **:00** | Everyone | **Pull main before writing another line.** |

**Rules that make it survive hour 14:**
- A branch never outlives one cycle. If it can't merge in one cycle, it was too big — split it.
- Bounced ≠ blocked. You keep building on your branch; you fix the conflict next cycle.
- **Only the integrator touches shared files.** The `PreToolUse` hook enforces it. If you need a nav entry or a barrel export, ask the integrator at :50 — don't edit it yourself.
- Red main outranks every feature. Integrator stops merging and fixes it.
- Missed a cycle? You merge next cycle. Never "I'll just merge at the end." That's precisely what stalled you last year.

---

# CADENCE

| Hour | Focus |
|---|---|
| 0–0.5 | Prompt 1 pushed. Everyone pulls. |
| 0.5–1 | **Hour 1 checkpoint:** every slice scaffolded + merged. Conflicts surface here or at hour 8. |
| 1–4 | Core CRUD + business logic per slice. Merge every hour. |
| 4–8 | Cross-slice seams wired. Shared components hardened. |
| 8–12 | **Feature-complete target.** Whole workflow usable end-to-end. Then freeze. |
| 12–16 | Testing pass, every feature, happy path + edges. `/debug`. |
| 16–20 | Polish, responsive + a11y, deploy, smoke-test the live URL. `/batch` for consistency passes. |
| 20–22 | Docs final, `reviewer-prep.md` filled for real, demo script written **and rehearsed**. |
| 22–24 | Buffer. Critical fixes only. Freeze the deploy well before 10:00. |

**Agent teams earn their cost in exactly two moments**, not the whole build: (1) a 3-agent parallel review — security / performance / test coverage — on one PR before a checkpoint; (2) competing-hypothesis debugging in the hour 12–16 bug bash. Everywhere else, subagents are cheaper and nearly as good.
