---
name: drizzle-schema
description: Conventions for this project's Drizzle + Neon database layer. Use whenever adding, modifying, or migrating ANY table, column, enum, relation, or index — including when the user just says "add a field", "we need to store X", or "the model needs Y". Also use before running any drizzle-kit command.
paths: db/**, drizzle.config.ts
---

# Drizzle Schema Conventions

Four people add tables in parallel tomorrow. Every rule here exists so they never touch the same line.

## Structure

1. **One file per table: `db/schema/<table>.ts`.** Never one large schema file. This is the single most important convention in the repo — it's what turns schema work from a merge-conflict generator into additive work.

2. **The barrel `db/schema/index.ts` is a SHARED FILE.** Only the integrator edits it, only at a sync point. The `PreToolUse` hook blocks you otherwise — that's not a bug, route the change through the integrator.

3. **Every table gets:** `id` (uuid, `defaultRandom()`), `createdAt`, `updatedAt`. Add `deletedAt` only where the domain genuinely needs recoverability — soft-delete everywhere is cargo cult and complicates every query.

4. **Enums are `pgEnum`, declared in the table's own file.** Relations declared alongside the table they belong to.

5. **Index every foreign key and every column you filter or sort a list by.** The DataTable paginates server-side; unindexed sorts are the performance question a reviewer asks.

## Migrations

```bash
pnpm db:generate      # produce the SQL
# READ THE SQL. Drizzle occasionally infers a drop where you meant a rename.
pnpm db:migrate       # against YOUR Neon branch (dev-1..dev-4), never main
pnpm db:studio        # visual check
```

**Neon branching:** each developer works on their own DB branch during parallel schema hours. Branches reconcile to main at the hourly integration checkpoints. Never migrate main from a feature session.

**Connection string:** always the pooled (`-pooler`) host. Vercel serverless functions exhaust direct connections and you will discover this at hour 20 under demo load.

## The generic tables already exist

`user` · `notification` · `activityLog` · `systemSetting` · `supportTicket`

**Extend them by reference — never duplicate their purpose.** If your slice needs notifications, insert into `notification` with a reference to your entity. Do not create `<yourEntity>Notification`. A second parallel notification system is a reviewer's favourite thing to find.

## Zod

One schema per entity, colocated, exported, and imported by **both** the API route and the form. `drizzle-zod` derives it from the table so the three never drift apart. Two hand-maintained copies always drift, usually at hour 14.
