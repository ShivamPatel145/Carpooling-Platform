# Product Overview

> This is a skeleton. The domain is revealed on build day. Fill every `TODO(build-day)` slot;
> do not invent a domain before the problem statement drops.

## Problem statement

`TODO(build-day)` — paste the ODOO problem statement verbatim here once released (~9:33, July 18).

## Chosen domain

`TODO(build-day)` — the domain we are building for (e.g. the entity type, the business process,
the primary user roles the domain maps onto admin/manager/approver/user).

## One-line value prop

`TODO(build-day)` — one sentence a reviewer remembers. What does this let a user do that they
couldn't before? No SaaS filler (see `docs/design-standards.md` §9).

## Primary users → role mapping

The scaffold ships four generic role tiers. Build-day maps the domain's real roles onto them
(the enum in `db/schema/user.ts` and the permission sets in `lib/permissions.ts`).

| App role tier | Hierarchy | Domain role (build-day)      |
| ------------- | --------- | ---------------------------- |
| `admin`       | 100       | `TODO(build-day)`            |
| `manager`     | 50        | `TODO(build-day)`            |
| `approver`    | 30        | `TODO(build-day)`            |
| `user`        | 10        | `TODO(build-day)`            |

## Requirement → Slice traceability

Every requirement from the problem statement maps to exactly one slice and either reuses an
existing scaffold asset or is genuinely NEW work. Fill this in as the first planning act on
build day — it is the backlog and the reviewer talking point in one table.

- **Slice** — which of A / B / C / D owns it (see `docs/team-ownership.md`).
- **Existing asset or NEW** — name the scaffold asset reused, or mark NEW.
- **Status** — `todo` / `in-progress` / `done`.

| # | Requirement                                | Slice | Existing asset or NEW                          | Status |
| - | ------------------------------------------ | ----- | ---------------------------------------------- | ------ |
| 0 | _Example:_ Signed-in users, 4 roles        | C     | Existing — Auth.js + `lib/permissions.ts`      | done   |
| 0 | _Example:_ CRUD for the core entity        | A     | Existing — copy `features/_demo/`              | done   |
| 0 | _Example:_ Printable document for a record | D     | Existing — copy `app/api/demo-entity/[id]/invoice/` | done |
| 0 | _Example:_ Audit trail of who did what     | C     | Existing — `lib/activity.ts` + `activityLog`   | done   |
| 1 | `TODO(build-day)`                          | ?     | `TODO(build-day)`                              | todo   |
| 2 | `TODO(build-day)`                          | ?     | `TODO(build-day)`                              | todo   |
| 3 | `TODO(build-day)`                          | ?     | `TODO(build-day)`                              | todo   |

## Out of scope

`TODO(build-day)` — what we are explicitly NOT building, so the demo stays focused.
