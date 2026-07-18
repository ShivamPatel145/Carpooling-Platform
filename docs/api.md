# API

REST route handlers under `app/api/`. Every resource follows the **same fixed shape** so any
endpoint is predictable. Conventions live in the `generic-crud` and `rbac-guard` skills.

## Fixed route shape

For a resource `<resource>`:

| File                                     | Handlers            | Purpose                          |
| ---------------------------------------- | ------------------- | -------------------------------- |
| `app/api/<resource>/route.ts`            | `GET`, `POST`       | List + create                    |
| `app/api/<resource>/[id]/route.ts`       | `GET`, `PATCH`, `DELETE` | Get / update / delete one   |
| `app/api/<resource>/my/route.ts`         | `GET`               | The current user's own records   |
| `app/api/<resource>/stats/route.ts`      | `GET`               | Aggregate counts for dashboards  |

Extra sub-routes hang off the resource as needed (e.g. `[id]/invoice/route.ts` for a PDF).

## Standard error envelope

`withErrorHandler` (`lib/api.ts`) maps every typed error and `ZodError` to one stable JSON shape.
The client's typed wrapper (`lib/fetcher.ts`) relies on it.

```jsonc
{
  "error": {
    "code": "FORBIDDEN",        // stable machine code: UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | VALIDATION | INTERNAL
    "message": "Human-readable.",
    "issues": { /* present only on VALIDATION — Zod flatten() output */ }
  }
}
```

| Status | Code           | When                                             |
| ------ | -------------- | ------------------------------------------------ |
| 401    | `UNAUTHORIZED` | Not signed in.                                   |
| 403    | `FORBIDDEN`    | Signed in, role lacks the permission.            |
| 404    | `NOT_FOUND`    | Record missing.                                  |
| 409    | `CONFLICT`     | Postgres unique violation (23505), auto-mapped.  |
| 422    | `VALIDATION`   | Zod parse failed; `issues` populated.            |
| 500    | `INTERNAL`     | Uncaught — no internals leaked.                  |

Success helpers: `ok(data)`, `created(data)` (201), `noContent()` (204).

## The required pattern: `requirePermission` first, `logActivity` on mutation

Every handler is wrapped in `withErrorHandler`, **opens** with `requirePermission(resource, action)`,
and every mutation **closes** with `logActivity`. This is the reference from
`app/api/demo-entity/route.ts`:

```ts
export const POST = withErrorHandler(async (req: Request) => {
  const session = await requirePermission("demoEntity", "create"); // ← FIRST. Always.
  const values = demoEntityFormSchema.parse(await req.json());       // ← shared Zod schema

  const [row] = await db.insert(demoEntity)
    .values({ ownerId: session.user.id, /* … */ })
    .returning();

  await logActivity({                                               // ← on every mutation
    actorId: session.user.id,
    action: "create",
    resource: "demoEntity",
    resourceId: row!.id,
    req,                                                            // captures IP + user-agent
  });

  return created(row);
});
```

Ownership-scoped routes additionally use `canEdit / canDelete / canView / canApprove` from
`lib/permissions.ts` before mutating someone else's record.

## Endpoint catalog

Endpoints that exist in the scaffold today.

| Method | Path                                  | Resource:Action    | Description                                  |
| ------ | ------------------------------------- | ------------------ | -------------------------------------------- |
| GET    | `/api/demo-entity`                    | `demoEntity:read`  | List all demo entities.                      |
| POST   | `/api/demo-entity`                    | `demoEntity:create`| Create a demo entity (owner = session user). |
| GET    | `/api/demo-entity/[id]`               | `demoEntity:read`  | Get one.                                     |
| PATCH  | `/api/demo-entity/[id]`               | `demoEntity:update`| Update one (ownership-scoped).               |
| DELETE | `/api/demo-entity/[id]`               | `demoEntity:delete`| Delete one (ownership-scoped).               |
| GET    | `/api/demo-entity/my`                 | `demoEntity:read`  | The current user's demo entities.            |
| GET    | `/api/demo-entity/stats`              | `demoEntity:read`  | Aggregate counts for dashboard widgets.      |
| GET    | `/api/demo-entity/[id]/invoice`       | `report:export`    | Render a placeholder invoice PDF (Node runtime). |
| POST   | `/api/auth/register`                  | — (public)         | Credentials sign-up.                         |
| *      | `/api/auth/[...nextauth]`             | — (Auth.js)        | Auth.js handler: sign-in, callbacks, session, OAuth. |
| *      | `/api/uploadthing`                    | signed-in          | UploadThing file router (auth-gated).        |

## Domain endpoints (build-day)

`TODO(build-day)` — copy the `demo-entity` route shape per domain resource. Add rows here as you go.

| Method | Path                       | Resource:Action    | Description        |
| ------ | -------------------------- | ------------------ | ------------------ |
| GET    | `/api/<entity>`            | `<entity>:read`    | `TODO(build-day)`  |
| POST   | `/api/<entity>`            | `<entity>:create`  | `TODO(build-day)`  |
