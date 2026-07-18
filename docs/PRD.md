# PRD — Enterprise Carpooling Platform
**Odoo x KSV Hackathon Final Round**
**Team:** Shivam (lead / integrator), Shreya, Hetvi, Mitesh
**Status:** confirmed — building to this. Version 2 (three-role onboarding folded in).

---

## 0. How to read this document

This PRD is the single source of truth for what we build in the next 24 hours. It is written to be *specific enough that four people can build in parallel without colliding.* Every module names its data, its screens, its acceptance test, and its owner. Where a decision could go two ways, §2 records which way we chose and the one-line answer to give a reviewer who asks "why."

Sections: §1 the product · §2 locked decisions · §3 what already exists · §4 the three roles + onboarding · §5 tenancy · §6 the data model · §7 every feature module in depth · §8 integrations + keys · §9 slice ownership · §10 hour-by-hour build order · §11 the demo · §12 risks · §13 deviations. Read §2, §4, §9 closely; the rest is reference you return to per-module.

---

## 1. What we're building

Daily commuting is expensive, congested, and wasteful, and employees on similar routes have no easy way to share a car. We're building an **Enterprise Carpooling Platform**: a multi-tenant web app where employees of a registered organization discover and share rides along common commutes.

The product is a complete ride-sharing ecosystem. An employee can **offer a ride** (as a driver in their own vehicle) or **find a ride** (as a passenger) — the same person, switching modes, not two separate accounts. Around that core sit vehicle management, a trip lifecycle with **live map tracking**, in-app **chat**, **wallet + card payments**, ride history, and a **cost/fuel analytics dashboard**. Above the employees sit two administrative tiers: a **Company Admin** who configures each organization, and a **Super Admin** who onboards the organizations themselves.

The judged deliverable is the **complete end-to-end business workflow**: publish a ride → someone books it → the trip runs and is tracked live → payment settles → it lands in history → it moves the analytics. Everything we build serves that loop first and bonus features second.

## 2. Locked decisions (the ones that shape architecture)

Decided with Shivam against the highest-risk ambiguities. Each carries the answer to give a reviewer.

| # | Decision | Choice | Reviewer answer |
|---|---|---|---|
| D1 | **Roles** | **Three: Super Admin, Company Admin, Employee.** Employee is a *mode-switcher* (offer vs find), not two roles. | The spec mandates one employee role that does both; we added Super Admin so organizations onboard through the product instead of hand-seeded SQL. |
| D2 | **Onboarding** | **Mostly self-service.** Super Admin creates orgs + invites admins; employees self-register by email domain; admin approves. Three paths, all built. | Manual entry of every user is a bottleneck and an empty demo. Domain-match onboarding is how real enterprise SaaS works and it populates our seed data. |
| D3 | **Live tracking** | **Pusher (managed WebSockets).** Fallback: 4-second polling. | Vercel serverless can't hold sockets; Pusher is managed with no server to run. Polling degrades the same UX invisibly if Pusher wobbles. |
| D4 | **Chat / call** | **Chat is real** (DB-persisted, over Pusher). **Call is a `tel:` deep-link** to the counterparty's number. | One realtime system, not two. "Call" is satisfied by a dialpad hand-off; WebRTC is scope we deliberately declined. |
| D5 | **Maps** | **OpenStreetMap + Leaflet (render) + OSRM (routing/ETA).** | No API key, no billing, no quota to blow at hour 20. Self-host OSRM for production; demo server for the hackathon. |
| D6 | **Payments** | **Stripe test mode.** | Same sandbox semantics as Razorpay, faster to integrate; Razorpay is a config swap. |
| D7 | **Multi-tenancy** | **Full isolation from hour 1.** `orgId` on every domain table, every query scoped, enforced in the RBAC layer. Super Admin is the sole deliberate exception. | Cheap in the schema now, brutal to retrofit. "How do you keep Org A out of Org B" is a headline reviewer question — we answer it structurally. |
| D8 | **Wallet** | **Append-only ledger.** Balance = sum of entries. Recharge via Stripe (Card/UPI + QR in the UI). | Auditable by construction, and the ledger doubles as an analytics source. |
| D9 | **Vehicle approval** | Vehicles have an **approval status** (approved/inactive); admin can approve, and may register vehicles on an employee's behalf. Only approved vehicles are selectable when publishing. | The wireframe makes vehicle vetting an admin duty — matches "manage registered vehicles and driver information." |
| D10 | **Employee record depth** | `user` carries **department, manager, officeLocation** and an admin-controlled **platform-access** (active/revoked) flag. | The wireframe's Employee Details + Platform Access screens; also enriches the participation monitor. |
| D11 | **Report-an-issue on a ride** | The ride "More Options" **Report an issue** action creates a `supportTicket` linked to the ride. | Reuses the Phase 0 supportTicket table; ties support to real ride context. |

## 3. What already exists (Phase 0 — reuse, never rebuild)

Verified last night: **22/22 runtime checks green**, three real bugs caught and fixed.

Auth.js (credentials + Google) · `lib/permissions.ts` resource-action RBAC (statement → per-role sets → numeric hierarchy → `canX` ownership helpers → `requirePermission` guard) · role-aware dashboard shell + 23 UI primitives (5 data-states: loading/skeleton/empty/error/success + status badges) · generic CRUD pattern + generic `<DataTable>` (search/filter/pagination) + RHF+Zod form primitives · generic tables `user`, `notification`, `activityLog`, `systemSetting`, `supportTicket` · Resend email + one React Email template · UploadThing · **@react-pdf worker-thread PDF pipeline** (renders a valid invoice) · seed infrastructure · 7 skills (`rbac-guard`, `drizzle-schema`, `generic-crud`, `reviewer-doc`, `project-type-picker`, `design-standards`, `qa-verify`) · design tokens (Space Grotesk / IBM Plex Sans / IBM Plex Mono, accent placeholder).

**Every feature in §7 maps to these where it can.** New tables and routes are only what the domain genuinely adds. The landmine from last night: `updatedAt` uses `$onUpdate(() => new Date())`, never `` sql`now()` `` (which silently breaks every UPDATE).

## 3.5 Wireframe alignment (the ODOO Excalidraw mockup)

The provided wireframe is a fully annotated, ~40-screen mockup in an Indian carpooling context (₹ fares, ISKCON→Infocity routes, tagline "Ride Together, Save Together"). It **validates this PRD** — every mandatory module has a corresponding screen — and adds specifics we've folded in: vehicle **approval status** (D9), richer **employee records** with department/manager/office + platform-access revoke (D10), **report-an-issue** on a ride (D11), a **swap-locations** control and saved-place autofill on Find/Offer, a **Financial Summary** (Revenue/Fuel/Maintenance/Net Profit) on Reports, Card/UPI-with-QR wallet recharge, and a **profile photo** at registration.

Build rule (per the `design-standards` skill): **the wireframe's information architecture and screen inventory are the structural base; its styling is replaced by our design tokens.** Where the wireframe's visual styling would trip a hard ban, structure wins and styling loses. Screen names in §7 match the wireframe's labels so the mapping in `docs/wireframe-map.md` is 1:1.

The mockup is mobile-first (phone frames). Our shell is desktop-dashboard-first, so each wireframe screen maps to a responsive route that must also hold at 375px — the wireframe is the 375px reference.

## 4. The three roles and how people get in

### 4.1 The roles

**Super Admin** — the platform operator (us). Bootstraps the platform: creates an organization (name, allowed email domain, currency), invites that org's one Company Admin, and views cross-org platform metrics (orgs, total users, total trips, platform-wide participation). **Never touches an individual employee, never books or offers a ride.** This is the *only* role whose queries are not `orgId`-scoped — it sees across tenants by design, which makes it the one deliberate, documented exception to the isolation rule (a strength to name, not a hole to hide).

**Company Admin** — one per organization. Responsible for platform *configuration only*, per the spec's explicit note that the admin is "not involved in day-to-day ride operations." Manages employee records (approve/deactivate), manages registered vehicles + driver info org-wide, configures org settings (fuel cost/km, travel cost/km, currency, allowed domains, auto-approve toggle), monitors employee participation. Scoped strictly to their own `orgId`.

**Employee** — the primary user, and a *mode-switcher*: the same account offers a ride when driving and finds a ride when riding. Registers/manages profile + saved places, registers/manages own vehicles, searches rides, publishes rides, books rides, manages trips (as driver or passenger), live-tracks active trips, chats, pays + manages wallet, views history + personal reports. Scoped to own `orgId`; ownership helpers further scope to own records.

### 4.2 `roleHierarchy` and the RBAC extension

```
super_admin: 100   // cross-tenant; the isolation exception
company_admin: 50  // scoped to own orgId
employee: 10       // scoped to own orgId + own records
```

`lib/permissions.ts` gains: `super_admin` in the role enum; the new resources (`organization`, `vehicle`, `ride`, `booking`, `trip`, `message`, `payment`, `wallet`, `invitation`, `savedPlace`, `report`) in the statement object; per-role action sets; and a tenancy wrapper so every non-super-admin query is `orgId`-filtered at the guard, not per-route. **This lands at the 9:30 sync point** so all four slices build on it from their first commit (Mitesh owns it — see §9).

### 4.3 The three onboarding paths (all built, so the live demo never depends on one)

**Path 1 — Super Admin bootstraps an org.** Super Admin creates the organization (name, `allowedEmailDomains`, currency, `autoApproveDomain` toggle) and sends an invitation to the intended Company Admin's email. The admin clicks the tokenized link, sets a password, lands in the admin console. How a brand-new company enters the platform.

**Path 2 — Company Admin invites staff.** The admin sends tokenized invite links to specific employees. Controlled onboarding for orgs that don't want open self-registration.

**Path 3 — Employee self-registers by domain.** Employee signs up with their work email; the domain is matched against every org's `allowedEmailDomains`; a match auto-assigns that `orgId` and sets status `pending`. If the org's `autoApproveDomain` is on, they're active immediately; otherwise they wait in the admin's approval queue. The realistic path, and the one that lets us seed ~8 employees per org without hand-entry.

**The `invitation` table** (token, orgId, role, email, expiresAt, status) backs Paths 1 and 2. **The domain match** backs Path 3. **Seed data** ships 2 orgs, 2 company admins, ~8 employees each, 1 super admin — so the app opens populated, and we demo *both* auto-approve (org A) and manual-approval (org B).

### 4.4 The auto-approve decision

We build the `autoApproveDomain` toggle and demo both modes: Org A auto-approves on domain match (seamless, fast to show); Org B routes new signups to the admin's approval queue (showcases the admin console + notification system). One toggle, two stories, no extra code.

## 5. Multi-tenancy (how isolation actually works)

Every domain table carries a non-null `orgId` FK to `organization`. The `orgId` is set exactly once — at the moment a user joins (domain match or accepted invite) — and is immutable thereafter. From then on:

- Every query for a non-super-admin role is filtered by the requester's `orgId`. Enforced in the RBAC/data layer wrapper, **not** left to each route to remember — a route that forgets is the classic tenancy leak, so we remove the opportunity to forget.
- `requirePermission(resource, action)` resolves the session's `orgId` and injects it into the query scope. Ownership helpers (`canX`) layer on top for record-level checks.
- **Super Admin is the single exception**, and its cross-tenant queries go through a separate, explicitly-named path (`requireSuperAdmin`) so the exception is visible in code review rather than an accident.

The reviewer question "how do you stop Org A seeing Org B" has a one-sentence answer: *isolation is enforced at the data-access layer keyed on an immutable orgId set at join time, with the platform operator as the only audited exception.* We test it explicitly (§7, §10): an admin in Org A requesting Org B's ride by id gets **404, not 403** — we don't even admit the record exists.

## 6. Data model

Drizzle, **one file per table** under `db/schema/`, barrel-exported (integrator-only). Every table: `id` (uuid, defaultRandom), `orgId` (except `organization` and super-admin-owned rows), `createdAt`, `updatedAt` (`$onUpdate(() => new Date())`). Index every FK and every column a list filters or sorts by.

| Table | Key fields | Notes | Owner |
|---|---|---|---|
| `organization` | name, allowedEmailDomains (text[]), currency, fuelCostPerKm, travelCostPerKm, autoApproveDomain (bool), settings (jsonb) | the tenant root | D |
| `user` *(extend Phase 0)* | + orgId (nullable for super_admin), phone, role, status (pending/active/inactive), avatarUrl, department, manager, officeLocation, platformAccess (active/revoked) | domain-match sets orgId; admin controls platformAccess | D |
| `invitation` | orgId, email, role, token, status, expiresAt | Paths 1 & 2 | D |
| `vehicle` | orgId, ownerId, model, registrationNo, seatingCapacity, approvalStatus (approved/inactive), registeredByAdminId (nullable) | only APPROVED selectable to offer; admin can approve or register on behalf | A (approval surface in D) |
| `savedPlace` | orgId, userId, label, lat, lng, address | Home/Office/custom | B |
| `ride` | orgId, driverId, vehicleId, origin (jsonb), destination (jsonb), departAt, seatsTotal, seatsAvailable, farePerSeat, routeGeoJSON, distanceKm, durationMin, status, isRecurring, recurrenceRule | routeGeoJSON cached from OSRM | A |
| `booking` | orgId, rideId, passengerId, seatsBooked, pickupPoint (jsonb), dropPoint (jsonb), fareAmount, status | decrements ride.seatsAvailable | A |
| `trip` | orgId, rideId, status (lifecycle), startedAt, completedAt, driverLat, driverLng, etaMin | one per ride once started | B |
| `tripEvent` | orgId, tripId, type, payload (jsonb), at | audit + tracking stream | B |
| `message` | orgId, tripId, senderId, body, readAt | per-trip chat | B |
| `payment` | orgId, bookingId, payerId, method, amount, status, stripePaymentIntentId | one per booking on completion | C |
| `walletEntry` | orgId, userId, delta, reason, refId, balanceAfter | append-only ledger | C |

**Enums:** `userRole` (super_admin, company_admin, employee) · `userStatus` (pending, active, inactive) · `rideStatus` (published, full, cancelled, completed) · `bookingStatus` (pending, confirmed, cancelled, completed) · `tripStatus` (booked, started, in_progress, completed, payment_pending, payment_completed) · `paymentMethod` (cash, card, upi, wallet) · `paymentStatus` (pending, succeeded, failed, refunded) · `invitationStatus` (pending, accepted, expired).

Reports are **computed**, not stored — a query/materialized view over `trip` + `ride` + `vehicle` + `walletEntry`, `orgId`-scoped. The wireframe's **Financial Summary** (monthly Revenue / Fuel Cost / Maintenance / Net Profit) is computed the same way: revenue from `walletEntry` ride_payments, fuel/travel cost from the org's cost config × distance, maintenance as an org-config line item. `supportTicket` gains an optional `rideId` so "Report an issue" links to a ride (D11).

## 7. Feature modules — in depth

Each module: what it does, the data it touches, screens, and the **acceptance test** QA verifies before it's "done." Mandatory unless marked bonus.

### 7.1 Authentication & org onboarding — *Slice D*
Splash → login / register / profile creation → dashboard. Registration matches email domain to an org and assigns `orgId` + `pending` status; invite links (Paths 1/2) pre-bind `orgId` and role. Reuses Phase 0 auth; adds the domain gate, the invitation flow, and three role redirects (super_admin → platform console, company_admin → admin console, employee → employee dashboard).
Registration collects name, phone, email, password, and an optional **profile photo** (UploadThing). The splash carries the platform tagline **"Ride Together, Save Together."**
**Screens:** Splash Screen (branding + tagline), Login (Email/Mobile + Password + Create New Account), Sign Up / Registration Form (+ Profile Photo), Accept Invite, Profile Creation.
**Accepts when:** all three onboarding paths land a user in the right console scoped to the right org; a wrong-domain signup is rejected clearly; a profile photo uploads.

### 7.2 Find a Ride — *Slice A*
Employee enters pickup, destination, travel date, travel time, seats needed, recurring flag. OSRM computes the route; Leaflet renders it for confirmation. The system matches published rides on route overlap + time window + available seats and lists each with driver details, route, departure time, seats left, fare/seat. Instant book from the list.
Wireframe specifics: a **swap-locations** button interchanges pickup/destination in one click; **saved places** autofill Start/Destination; Available Rides has **Refresh** and a **More Options → Report an issue** action per ride (D11).
**Screens:** Find Ride (form with swap + date/time + seats + recurring), Route Confirmation (map + Confirm), Available Rides (list, Refresh, Book Now, More Options).
**Accepts when:** a search returns a ride another employee published, booking it decrements that ride's `seatsAvailable` and creates a `booking`, and swap + saved-place autofill both work.

### 7.3 Offer a Ride — *Slice A*
Requires ≥1 **approved** vehicle (else prompt to add one / await approval). Driver enters pickup, destination, travel date/time, available seats, fare/seat. OSRM route → confirmation → the ride goes `published` and becomes findable.
**Screens:** Offer Ride (form), Route Confirmation (map), My Vehicle (picker — approved only).
**Accepts when:** a published ride appears in another employee's matching search, and publishing is blocked until an APPROVED vehicle exists (D9).

### 7.4 Route confirmation — *Slice A (shared map component with B)*
Shared Leaflet + OSRM component: polyline, distance + ETA, pickup + destination markers. Used by Find and Offer before commit. `routeGeoJSON`, `distanceKm`, `durationMin` cached on the `ride` so we don't re-hit OSRM per view (also mitigates OSRM rate limits).
**Accepts when:** the same route renders identically in Find, Offer, and later in tracking, from cached geometry.

### 7.5 Trip management — *Slice B*
After booking, rides appear under My Trips with two views: **driver view** (passenger details, vehicle, pickup/drop, schedule, fare, status) and **passenger view** (driver details, vehicle, pickup/drop, schedule, fare, status). Lifecycle state machine: `booked → started → in_progress → completed → payment_pending → payment_completed`. Transitions are driver-initiated (start, complete) or payment-initiated (payment states).
**Screens:** My Trips (list, both views), Trip Detail.
**Accepts when:** a booked trip advances through every state via the correct actor, and each state renders the right actions for driver vs passenger.

### 7.6 Live trip tracking — *Slice B, the headline realtime feature*
Once the driver taps Start, the driver's client emits location to a Pusher channel keyed on the trip; both parties see the live vehicle marker, current route, ETA, and pickup/destination markers on Leaflet. Active only while live; stops at completion. **Fallback:** if Pusher isn't solid by hour 6, Hetvi switches to 4-second polling of `trip.driverLat/Lng` — same UX, no channel plumbing. Decided by hour 6, not hour 20.
**Screens:** Live Tracking (map, both parties).
**Accepts when:** the passenger sees the driver's marker move and the ETA update in near-real-time **on the deployed URL** (not just locally), and tracking ends cleanly at completion.

### 7.7 Chat & call — *Slice B*
Per-trip chat thread persisted in `message`, delivered over the same Pusher channel as tracking (one realtime system). Unread state via `readAt`. **Call** is a `tel:` deep-link to the counterparty's phone — no in-app voice.
**Screens:** Chat with Driver (per trip), Call to Driver button that opens the dialer.
**Accepts when:** two participants exchange messages in real time within a trip, messages persist across reload, and the call button opens the dialer with the right number.

### 7.8 Payments & wallet — *Slice C*
On trip completion the passenger pays via cash, card (Stripe test), UPI, or wallet. Wallet is the append-only `walletEntry` ledger: balance = sum of deltas; recharge creates a positive entry funded by a Stripe payment; paying from balance creates a negative entry. Every payment writes a `payment` row; Stripe confirmations arrive via webhook at `/api/stripe/webhook`.
**Screens:** Payment (Cash/Card/UPI/Wallet select, Pay Now), Wallet (balance, Recharge Amount, Recharge Method = Card or UPI, UPI via ID or QR, Add Money).
**Accepts when:** a completed trip is paid via *both* wallet and Stripe test card; the wallet balance reflects a recharge and a spend; the webhook updates `payment.status` **on the deployed URL**.

### 7.9 Ride history — *Slice C*
Every completed trip: participants, route, vehicle, date/time, status. Read model over `trip` + `ride`, `orgId`-scoped, per-user filtered.
**Screens:** Ride History (list + detail).
**Accepts when:** a completed, paid trip appears in both participants' histories with correct details.

### 7.10 Vehicle management — *Slice A*
Employees register/manage multiple vehicles (model, registration no., seating capacity). Vehicles carry an **approval status**; only **approved** vehicles are selectable when publishing. A Company Admin can approve vehicles and may register one on an employee's behalf (D9). Built on generic CRUD.
**Screens:** My Vehicle (list/CRUD, status shown), Add Vehicle, Manage Vehicle (edit/remove); admin-side Registered Vehicles + Vehicle Details + approve.
**Accepts when:** a vehicle can be added, edited, approved by an admin, then selected in Offer a Ride; an unapproved or last-deleted vehicle blocks publishing.

### 7.11 Reports & analytics — *Slice C*
Dashboard over computed data: total trips, total distance, fuel consumption (distance × org's fuelCostPerKm), cost/km, vehicle-wise cost, fuel-efficiency trends, plus the wireframe's **Key Metrics** (total fuel cost, profit, vehicle utilization) and **Financial Summary** table (monthly Revenue / Fuel Cost / Maintenance / Net Profit). Recharts via `/dataviz` for chart selection + colorblind-safe palette. Employee sees personal; Company Admin sees org-wide.
**Screens:** Reports Dashboard (Key Metrics cards, Analytics Charts, Financial Summary table).
**Accepts when:** completing trips moves the numbers, the org's cost config (from Slice D) flows into cost + net-profit figures, and the Financial Summary renders monthly rows.

### 7.12 Company admin console — *Slice D*
Employee management (approval queue, activate/deactivate, **grant/revoke platform access**, add employee), employee records showing **name, email, department, manager, office location**; org-wide vehicle oversight with **approve/inactive** status and **add-vehicle-on-behalf**; org settings (Company Details + Carpooling Configuration: fuel cost per litre, travel cost per km, currency, allowed domains, auto-approve, maintenance line); participation monitor. All `orgId`-scoped. No ride operations.
**Screens:** Admin Dashboard, Employees (+ Employee Details, Add Employee, Platform Access), Registered Vehicles (+ Vehicle Details, Add Vehicle, approve/inactive), Org Settings (Company Details + Carpooling Configuration + Save Settings), Participation.
**Accepts when:** an admin approves a pending employee, revokes another's access, approves a vehicle, edits cost config that then appears in reports, and cannot see another org's data (404).

### 7.13 Super admin console — *Slice D*
Create organizations, invite company admins, view cross-org platform metrics. The only cross-tenant surface, via `requireSuperAdmin`.
**Screens:** Platform Dashboard, Organizations, Create Org / Invite Admin.
**Accepts when:** a super admin creates an org + invites its admin (Path 1 end-to-end), and sees platform-wide totals no single org admin can see.

### 7.14 Settings & saved places — *Slice B*
Quick-access hub (wireframe **Quick Access**): My Trips, My Vehicle, Payment Methods, Ride History, Saved Places, Help & Support (reuses `supportTicket`), Chat. Saved Places stores Home/Office/custom locations to speed search + publish and to power the swap/autofill on Find and Offer.
**Screens:** Settings, Saved Places (CRUD), Help & Chat.
**Accepts when:** a saved place autofills pickup/destination (and works with the swap button) in Find and Offer.

### 7.15 Notifications — *bonus, cheap (table exists) — Slice B wires, all emit*
Booking confirmed, trip started, payment received, employee-approved. In-app (`notification`) + email (Resend). Emitted by whichever slice owns the triggering action.
**Accepts when:** booking a ride notifies the driver in-app and by email.

### 7.16 Ride cancellation — *bonus — Slice A*
Driver cancels a ride → passengers auto-refunded to wallet (a positive `walletEntry`) + notified. Passenger cancels a booking → seat released back to `ride.seatsAvailable`.
**Accepts when:** a cancellation refunds correctly and frees the seat.

### 7.17 Further bonus (only after the demo loop is unbroken)
Intelligent ride matching (rank by route-overlap %), route optimization, enhanced analytics, real-time push. Explicitly *after* §11's loop works end to end.

## 8. Integrations & keys (Shivam, next hour)

| Service | Env vars | Action |
|---|---|---|
| Pusher | `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`, `NEXT_PUBLIC_PUSHER_KEY` | Create app (free tier). |
| Stripe | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Test mode; webhook → `/api/stripe/webhook`. |
| OSRM/OSM | none | Public OSRM demo server; Leaflet tiles from OSM. Note self-host for prod. |
| Already have | Google OAuth, Resend, UploadThing | From last night. |

## 9. Slice ownership

Four vertical slices, split to minimize shared-file overlap. Generic-heavy work (C, D) is least domain-coupled; the ride engine (A) is heaviest and most judged. **Slice D's tenancy pattern blocks everyone — built first.**

### SLICE A — Ride Engine · **Shivam** (also integrator)
Vehicles, rides, bookings, matching, Find/Offer, route confirmation, ride cancellation. The core product and the first thing a reviewer clicks. Owns `vehicle`, `ride`, `booking`. Shivam takes this *and* integrates because it sits at the center of every seam.
**Done:** publish → another employee finds & books → seats decrement → both see it in My Trips.

### SLICE B — Trips, Tracking & Chat · **Hetvi**
Trip lifecycle, Pusher wiring, live tracking, chat, `tel:` call, saved places, settings hub, notification wiring. The most technically novel slice — realtime is where the demo wows or dies. Owns `trip`, `tripEvent`, `message`, `savedPlace`.
**Done:** driver starts → passenger sees marker move + ETA + can chat, live → driver completes → state → payment_pending.
**Authority:** owns the Pusher-vs-polling call, decided by hour 6.

### SLICE C — Payments, Wallet & Reports · **Shreya** *(also design driver)*
Stripe, wallet ledger, payment methods, analytics dashboard, ride history. Self-contained and pipeline-rich (PDF + charts already exist). Owns `payment`, `walletEntry`, and the report read-model.
**Done:** complete a trip → pay via wallet AND Stripe test card → balance updates → trip in history → analytics moves.
**Design-driver duty:** run `/design-sync` + publish before 9:30, then drive Claude Design. Her slice is lightest at 10:00 (charts wait on data until hour 4) — exactly the room Design needs.

### SLICE D — Tenancy, Admin & Onboarding · **Mitesh**
Multi-tenant foundation (load-bearing — first), the three onboarding paths, invitation flow, super-admin console, company-admin console, employee/vehicle oversight, org + cost settings. Owns `organization`, `invitation`, `user` extensions.
**Done:** two orgs seeded → Org A admin can't see Org B's anything (404, not 403) → admin configures fuel cost → it flows into Slice C's reports → all three onboarding paths work.
**Critical:** the `orgId` scoping pattern lands in `lib/permissions.ts` at the 9:30 sync point. If it's late, everyone retrofits tenancy at hour 12. First commit.

### The seams (named owners)
- **booking → trip:** A creates the trip record; B drives its lifecycle. **B owns the handoff.**
- **trip completed → payment:** B signals; C collects. **C owns the trigger.**
- **cost config → reports:** D configures; C computes. **C owns the read.**
- **orgId everywhere:** D defines; all consume. **D owns the pattern; everyone applies it.**
- **onboarding → role redirect:** D owns all three consoles' entry routing.

## 10. Build order (maps to TOMORROW.md cadence)

| Hour | A · Shivam | B · Hetvi | C · Shreya | D · Mitesh |
|---|---|---|---|---|
| 0–1 | vehicle + ride schema | trip + message schema | payment + wallet schema | **orgId pattern + permissions + org/invitation schema (blocks all)** |
| 1–4 | Offer + Find + matching | trip lifecycle + Pusher POC | Stripe intent + wallet ledger | 3 onboarding paths + super-admin console |
| 4–8 | booking + seats + cancellation | live tracking on map | pay flow + wallet UI | company-admin console + employee mgmt |
| 8–12 | route confirm + polish | chat + call + saved places | reports dashboard | org/cost settings → reports; participation |
| **12** | **FEATURE FREEZE — no new features after this line** ||||
| 12–16 | cross-slice testing: the full **book → trip → track → pay → history → report** loop; RBAC negatives incl. the cross-org 404 |||| 
| 16–20 | polish, responsive (375/768/1024/1440), deploy hardening, **verify PDF + Pusher + Stripe webhook on the live Vercel URL** ||||
| 20–22 | reviewer-prep.md filled for real, demo script written **and rehearsed** ||||
| 22–24 | buffer; critical fixes only; freeze deploy well before 10:00 ||||

## 11. The demo (design toward it from hour 0)

Two employees in one org, side by side, one unbroken loop through every mandatory feature:

**Hetvi's screen offers a ride → Shivam's screen finds and books it → the driver starts the trip → the passenger watches the live marker move and chats with the driver → the driver completes the trip → the passenger pays from wallet balance → it lands in ride history → the analytics dashboard ticks up.** Then a 20-second coda: switch to the Company Admin to show the participation monitor moved, and the Super Admin to show two isolated orgs.

Everything we build serves this loop first. A bonus feature that doesn't touch the loop waits until the loop is solid.

## 12. Risk register

| Risk | Owner | Mitigation |
|---|---|---|
| Pusher realtime eats a day | Hetvi | Polling fallback **decided by hour 6**, not hour 20 |
| Tenancy retrofitted late | Mitesh | `orgId` in schema at hour 0; in permissions at 9:30 |
| Stripe webhooks flaky on serverless | Shreya | Test the webhook against the **deployed URL** early, not locally |
| OSRM demo server rate-limits | Hetvi/A | Cache route geometry on the `ride` row; note self-host for prod |
| PDF/Pusher/webhook differ serverless vs local | Shivam | Verify all three on the **live URL** by hour 16 (worker-thread already bit us once) |
| Scope: three roles + tenancy + realtime + payments all real | all | The §11 loop is the priority; bonus features only once it's unbroken |
| Super-admin cross-tenant path becomes an isolation hole | Mitesh | Single named `requireSuperAdmin` path; cross-org 404 test in the QA sweep |

## 13. Deviations from spec (answers ready)

- **Stripe, not Razorpay** — sandbox parity, faster integration, config swap.
- **`tel:` call, not in-app voice** — satisfies "call" without WebRTC scope.
- **OSRM demo server** — fine for the hackathon; self-host for production.
- **Three roles, not two** — the spec's two are intact (admin config-only, employee mode-switches); Super Admin is added so orgs onboard through the product, and it's the sole, audited tenancy exception.

---

*This is the build spec. §2, §4, §9 are the load-bearing decisions; the rest is per-module reference. On any mid-build ambiguity, the §11 demo loop is the tiebreaker: the choice that keeps that loop working wins.*
