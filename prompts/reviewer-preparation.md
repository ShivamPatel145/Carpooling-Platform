# Reviewer Preparation

**When to use this:** after any slice merges, whenever a trade-off is made, or when prepping for judging.
It maintains `docs/reviewer-prep.md` — the team's answers to the questions reviewers ask. Governed by
the `reviewer-doc` skill. Poor reviewer prep is a named cause of last year's loss, and it only works if
written **as the build happens** — written at hour 20 it becomes fiction, because nobody remembers why
they chose something at hour 3.

```
Update docs/reviewer-prep.md for {{feature}} / `{{entity}}`. Follow the reviewer-doc skill.

FIRST: confirm docs/reviewer-prep.md is still gitignored (it is, via .gitignore). NEVER commit it —
reviewers browse the repo; this is the team's private cheat sheet, not a deliverable.

FOR THIS MERGED SLICE, add four things — TWO SENTENCES EACH, no more:
  - what it does
  - why this design — and the alternative you REJECTED, and why
  - the trade-off you knowingly took
  - what you'd do with more time

WRITE IT AS SPOKEN ANSWERS, not documentation. A reviewer is standing at the desk asking. Register:
  "We used a resource-action statement object so authorization lives in one file instead of scattered
   role checks — it costs a small indirection but adding a role is one entry, not a grep."
NOT: "The RBAC subsystem implements a statement-based authorization model."

KEEP CURRENT the standing sections: product decisions · architecture · database design ·
security/RBAC · scalability · performance · engineering trade-offs · UI decisions · future
improvements.

TRADE-OFFS ARE THE HIGHEST-VALUE ENTRIES — "why didn't you use X" separates teams. Have a one-line
answer ready for every deliberate rejection this slice implies. The standing ones for this stack:
  - Why this stack over the reference repo's? → we took its PATTERNS, not its libraries, deliberately.
  - Why no Docker / Redis / Elasticsearch? → Vercel + Neon deployment; that infra is overhead we spent
    on features and testing instead.
  - How does RBAC actually work? → walk lib/permissions.ts; the statement object is the whole answer.
  - How would this scale? → pooled Neon connections, server-side pagination, indexed filters — name the
    actual mechanisms, not "it scales".
  - Why one file per schema table? → four devs in parallel; additive changes don't merge-conflict. This
    is an AI-assisted-development decision, and saying so is a strength.
  - What would you do next? → three real answers, not "more features".

WHAT MERGED / WHAT WAS DECIDED: {{the slice, and any architecture/trade-off decision made building it}}

Output the additions to docs/reviewer-prep.md. Keep the whole file skimmable under pressure at hour 22.
```

## Notes — check in the output

- **It edited `docs/reviewer-prep.md` and confirmed it stays gitignored.** If it committed the file or
  put these answers in a tracked doc, that defeats the purpose — reject.
- **Four things, two sentences each**, per slice — including the *rejected alternative*, which is the
  part teams skip and reviewers reward.
- **Spoken register**, not architecture-speak. It should read like an answer said out loud at the desk.
- **Trade-offs have crisp one-liners**, especially "why not X" (Docker/Redis/Elasticsearch, the
  reference repo's libraries) and "how does it scale" with named mechanisms.
- **Written now, while it's fresh** — this prompt is meant to fire after each merge, not once at hour 20.
