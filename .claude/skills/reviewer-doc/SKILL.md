---
name: reviewer-doc
description: Maintains docs/reviewer-prep.md, the team's answers to reviewer questions. Use whenever a feature slice is completed or merged, whenever an architecture decision or trade-off is made, and whenever the user mentions reviewers, judges, judging, demo prep, or asks "why did we do X". Self-trigger after any merged slice — do not wait to be asked.
paths: docs/**
---

# Reviewer Prep

Poor reviewer preparation is a named cause of last year's loss. This file is the fix, and it only works if it's written *as the build happens*. Written at hour 20 it becomes fiction — nobody remembers why they chose something at hour 3.

## Rules

1. **`docs/reviewer-prep.md` is gitignored. Verify it stays that way.** Never commit it. Reviewers may browse the repo; this is the team's cheat sheet, not a deliverable.

2. **After each merged slice, add four things.** Two sentences each, no more:
   - what it does
   - why this design (the alternative you rejected, and why)
   - the trade-off you knowingly took
   - what you'd do with more time

3. **Write it as spoken answers**, not documentation. A reviewer is standing at the desk asking a question. "We used a resource-action statement object so authorization lives in one file instead of scattered role checks — it costs a small indirection but means adding a role is one entry, not a grep." That's the register. Not "The RBAC subsystem implements a statement-based authorization model."

4. **Keep every section current:** product decisions · architecture · database design · security/RBAC · scalability · performance · engineering trade-offs · UI decisions · future improvements.

5. **Trade-offs are the highest-value entries.** "Why didn't you use X" is the question that separates teams. Every deliberate rejection — Prisma, Redis, Docker, Elasticsearch, the reference repo's observability stack — needs a one-line reason ready. Not knowing why you *didn't* do something reads worse than not having done it.

## Anticipate these

- Why this stack over the reference repo's? (We took its *patterns*, not its libraries — deliberately.)
- Why no Docker/Redis/Elasticsearch? (Vercel + Neon deployment; that infrastructure is overhead we spent on features and testing instead.)
- How does RBAC actually work? (Walk `lib/permissions.ts` — the statement object is the whole answer.)
- How would this scale? (Pooled Neon connections, server-side pagination, indexed filters — name the actual mechanisms.)
- Why one file per schema table? (Four devs in parallel; additive changes don't merge-conflict. This is an AI-assisted-development decision, and saying so is a strength.)
- What would you do next? (Have three real answers, not "more features".)
