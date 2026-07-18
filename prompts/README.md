# Prompt Library

Paste-ready prompts for building on this scaffold under time pressure. Each file is one focused,
reusable Claude Code prompt that already encodes this repo's conventions — the fixed API shape, the
one-Zod-schema rule, RBAC via `lib/permissions.ts`, the five data states, and the design law in
`docs/design-standards.md`. Open the file for the task you're on, copy the fenced block, fill the
tokens, paste into Claude Code.

## The token convention

Every template is parameterized with three literal tokens. Find-and-replace them before pasting:

| Token | Means | Example |
|---|---|---|
| `{{entity}}` | the domain object, camelCase singular (matches `features/<entity>/`, `db/schema/<entity>.ts`, the `statement` key) | `purchaseOrder` |
| `{{role}}` | an RBAC role from `lib/permissions.ts` | `approver` |
| `{{feature}}` | a human-readable capability / workflow name | `the approval chain` |

Derive the plural resource path (`app/api/<resource>/`), route group, and nav label from `{{entity}}`
as you go — the templates spell out how. Where a prompt needs a value that isn't one of these three,
it uses an inline `{{...}}` blank you fill by hand.

> These prompts assume the skills in `.claude/skills/` are active. They deliberately restate the key
> rules inline so the output is right even if a skill doesn't fire — but the skills are the source of
> truth. When a prompt and a skill disagree, the skill wins.

## Index

| Category | File | When to use |
|---|---|---|
| Project understanding | [project-understanding.md](project-understanding.md) | First thing in a session — get Claude oriented in the repo before it writes anything |
| Architecture | [architecture.md](architecture.md) | Planning where a feature lives; keeping the extensibility contract intact |
| Database | [database.md](database.md) | Adding or changing a table, column, enum, index, or relation |
| UI | [ui.md](ui.md) | Building any screen, page, or component on the shared primitives |
| APIs | [apis.md](apis.md) | Creating the API route set for a resource (`[id]`, create, `my`, `stats`) |
| Authentication | [authentication.md](authentication.md) | Adding a role, permission, ownership rule, or gating a route/page |
| Validation | [validation.md](validation.md) | Writing or fixing the one shared Zod schema for an entity |
| CRUD | [crud.md](crud.md) | Standing up a full list/create/edit/delete/detail slice for an entity |
| Analytics | [analytics.md](analytics.md) | Building charts / a stats endpoint / a reporting screen |
| Notifications | [notifications.md](notifications.md) | Notifying a user in-app and/or by email through the generic system |
| Documentation | [documentation.md](documentation.md) | Filling `docs/api.md`, `docs/database.md`, decisions, or an ERD |
| Testing | [testing.md](testing.md) | Verifying a slice before handoff (the qa-verify contract) |
| Bug fixing | [bug-fixing.md](bug-fixing.md) | Diagnosing and fixing a defect without regressing the pattern |
| Refactoring | [refactoring.md](refactoring.md) | Cleaning up drift, duplication, or a hand-rolled version of a primitive |
| Deployment | [deployment.md](deployment.md) | Getting green on Vercel; the integrator's merge + deploy checkpoint |
| Reviewer preparation | [reviewer-preparation.md](reviewer-preparation.md) | Capturing the answers reviewers will ask, as you build |

16 templates. Highest-traffic on build day: **crud**, **apis**, **database**, **ui**, **validation** —
they're the most concrete for a reason.
