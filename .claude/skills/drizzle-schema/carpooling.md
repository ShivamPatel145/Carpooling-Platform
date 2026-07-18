# Carpooling schema reference

Domain-specific companion to `SKILL.md`. The general rules there still hold — this file is the
carpooling table map (from `docs/PRD.md` §6). One file per table under `db/schema/`, barrel
integrator-only. Every domain table gets `id` (uuid) + `orgId` + `createdAt` + `updatedAt`
(`$onUpdate(() => new Date())`). Index every FK and every column a list filters/sorts by.

## The one non-negotiable: `orgId` on every domain table

Every table below except `organization` (the tenant root) and super-admin-owned rows carries a
**non-null `orgId`** FK to `organization`. It is set once at join time and immutable. Isolation is
enforced in the RBAC layer keyed on it — see `rbac-guard/reference.md` (tenancy section). Don't
scope per-route; scope at the guard.

## Enums (declare each in its own table's file with `pgEnum`)

| Enum | Values |
|---|---|
| `userRole` | super_admin, company_admin, employee |
| `userStatus` | pending, active, inactive |
| `platformAccess` | active, revoked |
| `vehicleApprovalStatus` | approved, inactive |
| `rideStatus` | published, full, cancelled, completed |
| `bookingStatus` | pending, confirmed, cancelled, completed |
| `tripStatus` | booked, started, in_progress, completed, payment_pending, payment_completed |
| `paymentMethod` | cash, card, upi, wallet |
| `paymentStatus` | pending, succeeded, failed, refunded |
| `invitationStatus` | pending, accepted, expired |

## Tables (owner in the last column — see `docs/team-ownership.md`)

| Table | Key fields | Notes | Owner |
|---|---|---|---|
| `organization` | name, allowedEmailDomains (text[]), currency, fuelCostPerKm (numeric), travelCostPerKm (numeric), maintenanceMonthly (numeric), autoApproveDomain (bool), settings (jsonb) | tenant root; NO orgId | D |
| `user` *(extend)* | + orgId (nullable — super_admin has none), phone, role (userRole), status (userStatus), avatarUrl, department, manager, officeLocation, platformAccess (platformAccess) | domain-match sets orgId; admin controls platformAccess | D |
| `invitation` | orgId, email, role (userRole), token (unique), status (invitationStatus), expiresAt | backs onboarding Paths 1 & 2 | D |
| `vehicle` | orgId, ownerId→user, model, registrationNo, seatingCapacity (int), approvalStatus (vehicleApprovalStatus), registeredByAdminId→user (nullable) | only APPROVED selectable to offer; admin can approve / register on behalf | A (approval surface D) |
| `savedPlace` | orgId, userId→user, label, lat (numeric), lng (numeric), address | Home/Office/custom | B |
| `ride` | orgId, driverId→user, vehicleId→vehicle, origin (jsonb {label,lat,lng}), destination (jsonb), departAt, seatsTotal (int), seatsAvailable (int), farePerSeat (numeric), routeGeoJSON (jsonb), distanceKm (numeric), durationMin (int), status (rideStatus), isRecurring (bool), recurrenceRule (text) | routeGeoJSON cached from OSRM | A |
| `booking` | orgId, rideId→ride, passengerId→user, seatsBooked (int), pickupPoint (jsonb), dropPoint (jsonb), fareAmount (numeric), status (bookingStatus) | decrements ride.seatsAvailable | A |
| `trip` | orgId, rideId→ride, status (tripStatus), startedAt, completedAt, driverLat (numeric), driverLng (numeric), etaMin (int) | one per ride once started | B |
| `tripEvent` | orgId, tripId→trip, type, payload (jsonb), at | audit + tracking stream | B |
| `message` | orgId, tripId→trip, senderId→user, body, readAt | per-trip chat | B |
| `payment` | orgId, bookingId→booking, payerId→user, method (paymentMethod), amount (numeric), status (paymentStatus), stripePaymentIntentId | one per booking on completion | C |
| `walletEntry` | orgId, userId→user, delta (numeric, +/-), reason, refId, balanceAfter (numeric) | append-only ledger; balance = sum(delta) | C |

Also: `supportTicket` *(extend Phase 0)* gains optional `rideId→ride` so "Report an issue" links a
ticket to a ride (D11). `user` already exists — extend it, don't recreate it.

## Money & geo types

- **Money** (`farePerSeat`, `fareAmount`, `delta`, `balanceAfter`, cost config): use `numeric`
  (Drizzle `numeric(...)` → returns string; coerce in Zod). Do NOT use `integer` cents here — the
  PRD works in ₹ with fractional km-cost math.
- **Lat/lng**: `numeric` (or `doublePrecision`) — never `integer`.
- **origin/destination/points/routeGeoJSON**: `jsonb` with a `$type<...>()` for shape safety.

## Reports are computed, not stored

No `report` table. Reports are `orgId`-scoped queries over `trip` + `ride` + `vehicle` +
`walletEntry`. Financial Summary = revenue from `walletEntry` ride-payment rows, fuel/travel cost
from the org's cost config × distance, maintenance from the org config line. Slice C owns the read.
