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
and every mutation **closes** with `logActivity`. Because the domain is multi-tenant, inserts set
`orgId` from the tenant and reads go through `scopedWhere`. This is the reference from
`app/api/vehicle/route.ts`:

```ts
export const POST = withErrorHandler(async (req: Request) => {
  const { session, tenant } = await requirePermission("vehicle", "create"); // ← FIRST. Always.
  const values = vehicleFormSchema.parse(await req.json());                  // ← shared Zod schema

  const [row] = await db.insert(vehicle)
    .values({ orgId: tenant.orgId!, ownerId: session.user.id, /* … */ })     // ← tenant-scoped insert
    .returning();

  await logActivity({                                                        // ← on every mutation
    orgId: tenant.orgId,
    actorId: session.user.id,
    action: "create",
    resource: "vehicle",
    resourceId: row!.id,
    req,                                                                     // captures IP + user-agent
  });

  return created(row);
});
```

Ownership-scoped routes additionally use `canEdit / canDelete / canView / canApprove` from
`lib/permissions.ts` before mutating someone else's record.

## Endpoint catalog

The live domain endpoints, by slice. Every route is `orgId`-scoped for non-super-admins; a cross-org
id returns **404, not 403**.

### Slice A — ride engine (vehicle · ride · booking)

| Method | Path                        | Resource:Action    | Description                                              |
| ------ | --------------------------- | ------------------ | -------------------------------------------------------- |
| GET    | `/api/vehicle`              | `vehicle:read`     | List vehicles in the org.                                |
| POST   | `/api/vehicle`              | `vehicle:create`   | Register a vehicle (starts `inactive`, awaits approval). |
| GET/PATCH/DELETE | `/api/vehicle/[id]` | `vehicle:*`      | Get/update/delete one (ownership-scoped).                |
| GET    | `/api/vehicle/my`           | `vehicle:read`     | The caller's vehicles (`?approved=1` for the ride pool). |
| POST   | `/api/ride`                 | `ride:create`      | Publish a ride; caches the OSRM route on the row.        |
| GET    | `/api/ride` · `/api/ride/my`| `ride:read`        | Published rides in org · the caller's own rides.         |
| GET    | `/api/ride/[id]`            | `ride:read`        | One ride, enriched with driver + vehicle.                |
| POST   | `/api/ride/[id]/cancel`     | `ride:cancel`      | Cancel a ride; releases its bookings.                    |
| POST   | `/api/ride/search`          | `ride:read`        | Proximity match (org-scoped SQL + haversine rank).       |
| POST   | `/api/booking`              | `booking:create`   | Book seat(s) — atomic conditional decrement (409 on race).|
| GET    | `/api/booking/my`           | `booking:read`     | The caller's bookings.                                   |
| POST   | `/api/booking/[id]/cancel`  | `booking:cancel`   | Cancel a booking; returns the seat to the ride.          |

### Slice B — trips, tracking, chat, saved places

| Method | Path                          | Resource:Action | Description                              |
| ------ | ----------------------------- | --------------- | ---------------------------------------- |
| GET/POST | `/api/trip`                 | `trip:*`        | Trip lifecycle (created from a booking). |
| GET    | `/api/trip/[id]`              | `trip:read`     | Trip detail.                             |
| POST   | `/api/trip/[id]/transition`   | `trip:update`   | Advance trip status.                     |
| POST   | `/api/trip/[id]/location`     | `trip:track`    | Push a live location ping (Pusher).      |
| GET/POST | `/api/saved-place` · `/[id]`| `savedPlace:*`  | Saved-place CRUD.                        |
| POST   | `/api/message`               | `message:create`| Per-trip chat message.                   |
| GET    | `/api/history`               | `trip:read`     | Completed trips (as driver or passenger).|
| POST   | `/api/pusher/auth`           | signed-in       | Pusher private-channel auth.             |

### Slice C — payments & wallet

| Method | Path                              | Resource:Action  | Description                          |
| ------ | --------------------------------- | ---------------- | ------------------------------------ |
| POST   | `/api/payment`                    | `payment:create` | Pay for a trip (wallet/card/upi/cash).|
| GET    | `/api/wallet` · `/wallet/balance` | `wallet:read`    | Wallet ledger · current balance.     |
| POST   | `/api/wallet/recharge`            | `wallet:recharge`| Start a Stripe recharge intent.      |
| POST   | `/api/stripe/webhook`             | — (Stripe sig)   | Payment/recharge webhook.            |
| GET    | `/api/report` · `/report/receipt/[tripId]` | `report:read` / `trip:read` | Metrics · PDF receipt. |

### Slice D — tenancy & admin

| Method | Path                                   | Resource:Action     | Description                     |
| ------ | -------------------------------------- | ------------------- | ------------------------------- |
| GET/POST | `/api/organization` · `/[id]`        | `organization:*`    | Org CRUD (super-admin).         |
| GET/POST | `/api/invitation` · `/[id]` · `/accept`| `invitation:*`    | Invite lifecycle + acceptance.  |
| GET/PATCH | `/api/user` · `/[id]`                | `user:*`            | User management (company-admin).|
| GET/PATCH | `/api/vehicle/admin` · `/[id]`       | `vehicle:approve`   | Admin vehicle approval queue.   |

### Cross-cutting

| Method | Path                        | Resource:Action | Description                                   |
| ------ | --------------------------- | --------------- | --------------------------------------------- |
| GET    | `/api/activity-log`         | `activityLog:read` | Audit trail.                               |
| GET    | `/api/notifications/stats`  | signed-in       | Unread notification count.                    |
| POST   | `/api/auth/register`        | — (public)      | Credentials sign-up.                          |
| *      | `/api/auth/[...nextauth]`   | — (Auth.js)     | Sign-in, callbacks, session, OAuth.           |
| *      | `/api/uploadthing`          | signed-in       | UploadThing file router (auth-gated).         |

| Method | Path                       | Resource:Action    | Description        |
| ------ | -------------------------- | ------------------ | ------------------ |
| GET    | `/api/<entity>`            | `<entity>:read`    | `TODO(build-day)`  |
| POST   | `/api/<entity>`            | `<entity>:create`  | `TODO(build-day)`  |
