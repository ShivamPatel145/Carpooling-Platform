# Testing & Verification

**When to use this:** before reporting any slice or fix as done, or when handed work to verify. The
contract from the `qa-verify` skill: **nothing is done until it's tested.** "It compiles", "it
typechecks", and "it looks right" are inputs to verification, never the conclusion. In a 24-hour build
the running app is the source of truth, not the test suite.

```
Verify the {{feature}} / `{{entity}}` slice against the qa-verify contract. Do NOT accept "it
compiles" as a result — exercise it in the running app and report evidence.

BUILDER SELF-CHECK (before any handoff):
  pnpm typecheck && pnpm lint && pnpm build    # all clean, no exceptions
  then /verify (or /run) — WATCH the change actually work in the app, don't just trust the tests.

INDEPENDENT QA (run this in a SEPARATE session from whoever built it — self-review finds only what you
were already looking for). Check, with evidence for each:
1. THE REQUIREMENT — which specific requirement does this claim to satisfy? Does it, actually?
2. HAPPY PATH through the REAL UI — the flow a reviewer would click: create → see it in the
   <DataTable> list → open detail → edit → delete. Not a unit test.
3. AT LEAST ONE EDGE CASE — empty input, missing record (bad id → 404), a boundary value, or a
   duplicate submit.
4. RBAC NEGATIVE TEST — MANDATORY. Hit the endpoint DIRECTLY (curl/fetch) as the role that should NOT
   have access ({{role}}) and confirm a 403 — not merely that the nav item is hidden. Include the exact
   request and the status you got. This is the #1 /security-review finding and #1 reviewer probe.
5. ALL FIVE STATES actually render: loading skeleton, empty (with real copy, not a blank div), error
   (with retry), success toast, status badge.
6. DESIGN — the §9 vibe-code checklist from docs/design-standards.md. Every item NO.
7. WIDTHS — 375px and 1440px. Nav collapses, the mobile menu works, no horizontal scroll.
8. /code-review on the diff. /security-review if it touches auth, RBAC, uploads, or personal/financial
   data.

DEFINITION OF DONE (per slice): schema migrated + merged · full CRUD through the API · Zod on every
input · RBAC guarded at API AND UI · all five states on every screen · responsive · happy path + one
edge case manually tested · docs/api.md and docs/database.md sections filled · no console errors ·
merged to main.

REJECT back with specifics — never fix silently (a silent fix hides the pattern from the next slice).

REPORT in exactly this shape, nothing outside it:
──────────────────────────────────────
AGENT:    <builder-N | qa | integrator>
SLICE:    <name>          TIME: <hh:mm>   HOUR: <n/24>
DONE:     <shipped since last report — one line each>
TESTED:   <evidence: commands run, flows exercised, edge case, RBAC negative case, widths checked>
BLOCKED:  <blocker + what's needed + from whom — or "none">
NEXT:     <single next action>
DEPLOY:   <green | red + live URL state>
──────────────────────────────────────

WHAT TO VERIFY: {{the slice/fix and the requirement it claims}}
```

## Notes — check in the output

- **TESTED has evidence, not adjectives.** Commands actually run, flows actually clicked, the RBAC
  negative request and its status code. "Verified working" with no evidence is a rejection, not a report.
- **The RBAC negative test hit the API directly** and got a 403. A hidden button is not authorization —
  this is non-negotiable.
- **All five states were observed**, including the empty state having real copy.
- **375px and 1440px both checked**, mobile menu works, no horizontal scroll.
- **Independent.** QA should be a different session from the builder. If the same agent built and
  "verified", treat it as unverified.
- **Rejections are specific**, and nothing was silently patched over.
