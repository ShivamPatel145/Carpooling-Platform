---
name: qa-verify
description: The verification contract for this team's multi-agent workflow. Use whenever a task, feature, slice, or fix is about to be reported as done or handed off; whenever spawning a subagent or teammate to build something; and whenever the user says "test", "verify", "check", "is it working", or "done". Also use before every integration checkpoint and before opening any PR.
---

# QA & Verification

Limited testing is a named cause of last year's loss. This is the contract that replaces it.

## The premise

**Nothing is done until it's tested.** "It compiles", "it typechecks", and "it looks right" are not test results. A builder's claim is the *input* to verification, never the conclusion.

## Builder self-verification — before any handoff

```bash
pnpm typecheck && pnpm lint && pnpm build    # all clean, no exceptions
/verify                                       # or /run — WATCH the change work in the app
```

`/verify` builds and runs the app to confirm the change does what it should. Use it instead of falling back to "the tests pass" — in a 24-hour build the test suite isn't the source of truth, the running app is.

A builder handing off untested work hasn't finished; they've delegated their job to QA.

## QA verification — independent, never the builder

Run in a **separate agent or session** from whoever built it. Self-review finds what you were already looking for.

1. **The requirement.** Which specific problem-statement requirement does this claim to satisfy? Does it, actually?
2. **Happy path** through the real UI. Not a unit test — the actual flow a reviewer would click.
3. **At least one edge case:** empty input, missing record, boundary value, duplicate submit.
4. **RBAC negative test — mandatory.** Confirm the role that should NOT have access is refused **at the API**, hitting the endpoint directly. A hidden nav item is not authorization. This is the #1 finding in `/security-review` and the #1 thing reviewers probe.
5. **All five states render:** loading skeleton, empty, error, success toast, status badge. An empty state is not a blank div.
6. **Design:** the vibe-code checklist from `design-standards`. Every item NO.
7. **Widths:** 375px and 1440px. Nav collapses and the mobile menu works.
8. **`/code-review`** on the diff. **`/security-review`** on anything touching auth, RBAC, uploads, or personal/financial data.

**Reject back to the builder with specifics.** Never fix silently — a silent fix hides the pattern from the next slice and teaches nobody.

## Definition of done, per slice

Schema migrated + merged · full CRUD through the API · Zod on every input · RBAC guarded at API **and** UI · all five states on every screen · responsive · happy path + one edge case manually tested · `docs/api.md` and `docs/database.md` sections filled · no console errors · merged to main.

## Report format — mandatory, nothing outside it

```
AGENT:    <builder-N | qa | integrator>
SLICE:    <name>              TIME: <hh:mm>   HOUR: <n/24>
DONE:     <shipped since last report — one line each>
TESTED:   <evidence: commands run, flows exercised, edge case, RBAC negative case,
           widths checked>
BLOCKED:  <blocker + what's needed + from whom — or "none">
NEXT:     <single next action>
DEPLOY:   <green | red + live URL state>
```

**A feature absent from TESTED is not DONE.** If TESTED says "verified working" with no evidence, that's a rejection, not a report.

## The deploy rule

Reviewers can arrive at any hour of the 24. The deployed URL stays working and demoable at **every** checkpoint. A red deploy outranks any feature — fix it first, always.
