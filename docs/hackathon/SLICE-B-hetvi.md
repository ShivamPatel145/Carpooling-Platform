# Slice B — Trips, Tracking & Chat · Hetvi

Send Hetvi this. She pastes it into Claude Code in her clone, on branch `slice-b-trips-tracking`.

```
You are building SLICE B (Trips, Tracking & Chat) of our Enterprise Carpooling Platform. Read
CLAUDE.md, docs/PRD.md §7.5/§7.6/§7.7/§7.14, docs/team-ownership.md, docs/wireframe-map.md first.
Work ONLY on branch slice-b-trips-tracking. Obey the skills: generic-crud, drizzle-schema,
rbac-guard, design-standards, qa-verify. This is the most technically novel slice — realtime is
where the demo wows or dies.

The scaffold is DONE and verified — reuse it, never rebuild it. Schema (trip, tripEvent, message,
savedPlace + enums) is migrated to Neon. RBAC + tenancy live in lib/permissions.ts.

MY TABLES (already created): trip, tripEvent, message, savedPlace. MY ROUTE GROUP: /app/trips
(incl. /track), /app/saved-places, /settings. MY API FOLDERS: app/api/trip, app/api/message,
app/api/saved-place, app/api/pusher/auth. MY FEATURE FOLDERS: features/trip, features/message,
features/saved-place. Do NOT touch: db/schema/index.ts, nav.config.ts, CLAUDE.md, lib/permissions.ts
(ask Shivam the integrator), or Slice A/C/D's tables and folders.

TENANCY IS MANDATORY on every query:
- Every route opens with `const { session, tenant } = await requirePermission("<resource>","<action>")`.
- Scope EVERY query with `scopedWhere(tenant, trip, eq(trip.id, id))`; set `orgId: tenant.orgId` on inserts.
- Cross-org fetch → returns nothing → throw NotFoundError (404, NOT 403).
- Close mutations with `logActivity({ orgId: tenant.orgId, actorId: session.user.id, ... })`.

I OWN THE PUSHER-VS-POLLING DECISION — decide by hour 6, not hour 20. Build Pusher first; if it's not
solid by hour 6, fall back to 4-second polling of trip.driverLat/Lng (same UX, no channel plumbing).

BUILD IN THIS ORDER (small, frequent commits; push to slice-b-trips-tracking):
1. Trip lifecycle — a booking becomes a trip when the driver starts. State machine (tripStatusEnum):
   booked → started → in_progress → completed → payment_pending → payment_completed. API app/api/trip
   with transitions (tripTransitionSchema in db/schema/trip.ts). Write a tripEvent row on each
   transition. My Trips screen /app/trips with a DRIVER view and a PASSENGER view (StatusBadge for the
   lifecycle). Trip detail /app/trips/[id]. SEAM: Slice A creates the booking; I own the booking→trip
   handoff — read A's booking, don't modify it.
2. Live tracking — /app/trips/[id]/track. Driver client posts location to app/api/trip/[id]/location
   (tripLocationSchema: lat/lng/etaMin); broadcast on a Pusher channel keyed on the trip. Both parties
   see a moving marker + live route + ETA on Leaflet (reuse Shivam's shared map component). Active only
   while status is started/in_progress; stops at completion. `pnpm add pusher pusher-js`. Env:
   PUSHER_APP_ID/KEY/SECRET/CLUSTER + NEXT_PUBLIC_PUSHER_KEY (ask Shivam for the keys).
   app/api/pusher/auth authorizes private channels.
3. Chat — per-trip thread in the message table (messageFormSchema), delivered over the SAME Pusher
   channel as tracking (one realtime system, not two). Unread via readAt. Chat panel on the trip detail.
4. Call — a `tel:` deep-link button to the counterparty's phone (user.phone). No in-app voice.
5. Saved Places — CRUD (savedPlaceFormSchema) at /app/saved-places. Home/Office/custom. Slice A reads
   these for autofill on Find/Offer — expose them, don't build A's forms.
6. Settings / Quick Access hub — /settings: links to My Trips, My Vehicle, Payments, History, Saved
   Places, Help, Chat. Reuse supportTicket for Help.
7. Notifications wiring — when a booking is confirmed / trip started / completed, insert a notification
   row + send email (lib/email.ts sendNotificationEmail). Other slices emit for their own actions.

Use <DataTable> for lists, form primitives for forms, the five states on every screen, StatusBadge
(extend STATUS_VARIANTS with trip statuses). Responsive 375/1440. prefers-reduced-motion respected.

SEED LOGINS: driver employee@demo.dev, passenger rider@demo.dev (both org "Acme Mobility"), password
Password123!. A published ride + a booking already exist to turn into a trip.

DEFINITION OF DONE (qa-verify): driver starts a trip → passenger sees the marker move + ETA update +
can chat, live, ON THE DEPLOYED URL (not just localhost) → driver completes → status → payment_pending.
Messages persist across reload. RBAC negative AT THE API: a Globex user cannot read an Acme trip by id
(404). typecheck + lint + build clean. Report DONE/TESTED/BLOCKED/NEXT. Ask Shivam for nav/keys.
```
