# Slice A — Ride Engine · Shivam (you, also integrator)

Paste this into Claude Code in your clone, on your branch `slice-a-ride-engine`.

```
You are building SLICE A (Ride Engine) of our Enterprise Carpooling Platform. Read CLAUDE.md,
docs/PRD.md §7.2/§7.3/§7.4/§7.10/§7.16, docs/team-ownership.md, and docs/wireframe-map.md first.
Work ONLY on branch slice-a-ride-engine. Obey the skills: generic-crud, drizzle-schema, rbac-guard,
design-standards, qa-verify.

The scaffold is DONE and verified — reuse it, never rebuild it. Schema (organization, user, vehicle,
ride, booking + all enums) is migrated to Neon. RBAC + tenancy live in lib/permissions.ts.

MY TABLES (already created): vehicle, ride, booking. MY ROUTE GROUP: /app/find, /app/offer,
/app/rides, /app/vehicles. MY API FOLDERS: app/api/vehicle, app/api/ride, app/api/booking.
MY FEATURE FOLDERS: features/vehicle, features/ride, features/booking (copy features/_demo/).
Do NOT touch: db/schema/index.ts, nav.config.ts, CLAUDE.md, lib/permissions.ts (ask me — I'm the
integrator), or Slice B/C/D's tables and folders.

TENANCY IS MANDATORY on every query (this is the reviewer's #1 question):
- Every route opens with `const { session, tenant } = await requirePermission("<resource>", "<action>")`.
- Scope EVERY query: `db.select().from(ride).where(scopedWhere(tenant, ride, eq(ride.id, id)))`.
- Set `orgId: tenant.orgId` on every insert.
- Cross-org fetch by id → the scoped fetch returns nothing → throw `NotFoundError` (404, NOT 403).
- Close every mutation with `logActivity({ orgId: tenant.orgId, actorId: session.user.id, action, resource, resourceId, req })`.

BUILD IN THIS ORDER (small, frequent commits; push to slice-a-ride-engine):
1. Vehicle CRUD — copy features/_demo/ → features/vehicle/. Fields: model, registrationNo,
   seatingCapacity, approvalStatus (approved/inactive). API app/api/vehicle/{route,[id]}. Employees
   manage their OWN vehicles (canEdit/canDelete ownership). Screen /app/vehicles (DataTable + form).
2. Offer a Ride — features/ride/, form on offerRideFormSchema (already in db/schema/ride.ts): vehicle
   picker (APPROVED vehicles only — filter approvalStatus="approved" AND ownerId=session.user.id),
   origin/destination, departAt, seatsTotal, farePerSeat. Publishing sets status="published",
   seatsAvailable=seatsTotal. BLOCK publishing if the user has no approved vehicle. Screen /app/offer.
3. Find a Ride — features/ride/ search on findRideFormSchema: origin/destination + swap button +
   date/time + seats. Match published rides in the SAME org (scopedWhere handles it) with
   seatsAvailable >= requested. List with driver, route, departAt, seats left, fare/seat, Book Now.
   Screen /app/find + /app/find/results. Saved-place autofill reads Slice B's savedPlace (read-only).
4. Booking — POST app/api/booking creates a booking AND decrements ride.seatsAvailable in the same
   transaction. When seatsAvailable hits 0, set ride.status="full". Screen shows confirmation.
5. Route confirmation map — a shared Leaflet + OSRM component (I own it; B consumes it for tracking).
   Cache routeGeoJSON, distanceKm, durationMin on the ride row so we don't re-hit OSRM. Public OSRM
   demo server, no key. Leaflet tiles from OSM. `pnpm add leaflet react-leaflet` (+ @types/leaflet).
6. (bonus, after the loop works) Ride cancellation — driver cancels → passengers refunded to wallet
   (coordinate with C: insert a positive walletEntry) + notified; passenger cancels → seat released.

Use the generic <DataTable> for every list, the form primitives (components/form) for every form, the
five states (components/states) on every screen, StatusBadge for ride/booking status (extend
STATUS_VARIANTS). Money is numeric → coerce with z.coerce.number in Zod. Responsive at 375/1440.

SEED LOGIN for testing: employee@demo.dev / Password123! (org "Acme Mobility"). A published ride +
a booking already exist in the seed.

DEFINITION OF DONE (qa-verify): publish a ride → log in as rider@demo.dev, find & book it → seats
decrement → both see it. RBAC negative AT THE API: a Globex employee (kabir@globex.dev) cannot GET
an Acme ride by id (must be 404). typecheck + lint + build clean. Then report DONE/TESTED/BLOCKED/NEXT.
Ask me (integrator) for any nav.config.ts entry or db/schema/index.ts change.
```
