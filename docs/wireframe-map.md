# Wireframe Map — screens → routes → components

Maps every screen in `docs/wireframe/wireframe-screens.md` (the ODOO Excalidraw mockup) to a route
in this app, the shell region it lives in, and the components it uses. Produced at the 9:30 sync.

**Build rule:** the wireframe's information architecture is the structural base; styling comes from
`lib/design-tokens.ts` (accent = teal-700). Where the wireframe's styling trips a design-standards
hard ban, **structure wins, styling loses**. The mockup is mobile-first phone frames — every route
must also hold at 375px (the wireframe IS the 375px reference), and 768 / 1024 / 1440.

## Route groups (three consoles + shared auth)

| Group | Prefix | Gate | Who | Owner |
|---|---|---|---|---|
| `(auth)` | `/login`, `/register`, `/accept-invite`, `/` (splash) | public | everyone | D |
| `(dashboard)` → employee app | `/app/*` (and current `/dashboard`, `/demo`, `/notifications`, `/support`, `/reports`) | `requireSession` | employee | A/B/C |
| `(dashboard)/platform` | `/platform/*` | `requireSuperAdminPage` | super_admin | D |
| `(dashboard)/admin` | `/admin/*` | `requireRolePage("company_admin")` | company_admin | D |

> Note: the Phase-0 employee routes currently live at `/dashboard`, `/demo`, etc. Build-day may move
> ride screens under an `/app/*` prefix; keep the shell + primitives, repoint routes. The nav
> (`nav.config.ts`) already targets roles explicitly so each console shows only its own items.

Shell region legend: **Sidebar** (role nav), **Topbar** (brand/bell/theme/user), **Main** (page body),
**Map** (Leaflet), **Dialog/Sheet** (modal).

---

## Auth & onboarding — Slice D (§7.1)

| Wireframe screen | Route | Shell region | Components | Status |
|---|---|---|---|---|
| Splash Screen (branding + "Ride Together, Save Together") | `/` | full-page | marketing/public-header, Reveal, Button | ADAPT (homepage exists) |
| Login (Email/Mobile + Password) | `/login` | auth layout | auth/login-form, GoogleButton | ADAPT (add email-or-mobile) |
| Sign Up / Registration Form (+ Profile Photo) | `/register` | auth layout | auth/register-form, FileField (avatar), phone | ADAPT |
| Accept Invite (set password) | `/accept-invite?token=…` | auth layout | NEW form on acceptInviteSchema | NEW |
| Profile Creation | part of `/register` | auth layout | form primitives | NEW |
| Application Header (branding + profile) | all consoles | Topbar | shell/dashboard-shell, user-menu | EXISTS |

## Employee app — dashboard & mode switch (§7.1, §7.14)

| Wireframe screen | Route | Region | Components | Status |
|---|---|---|---|---|
| Employee dashboard ("Hello [name]", Find/Offer, active-trip strip) | `/dashboard` (or `/app`) | Main | PageHeader, StatCard, two CTA cards, active-trip strip | ADAPT |
| Quick Access (My Trips/Vehicle/Payments/History/Saved/Help/Chat) | `/settings` or dashboard hub | Main | nav cards | NEW (B) |
| Settings | `/settings` | Main | tabs, form primitives | NEW (B) |
| Saved Places (CRUD) | `/app/saved-places` | Main + Dialog | DataTable, form (savedPlaceFormSchema) | NEW (B) |
| Help & Chat | `/support` | Main | supportTicket CRUD (exists) | ADAPT |

## Find a Ride — Slice A (§7.2)

| Wireframe screen | Route | Region | Components | Status |
|---|---|---|---|---|
| Find Ride (form: start/dest + swap + date/time + seats + recurring) | `/app/find` | Main | form (findRideFormSchema), swap button, saved-place autofill | NEW |
| Route Confirmation (map + Confirm) | `/app/find/route` (or dialog) | Map + Main | shared Leaflet/OSRM map, Confirm | NEW |
| Available Rides (list, Refresh, Book Now, More Options→Report issue) | `/app/find/results` | Main | DataTable/cards, StatusBadge, book action, supportTicket link (D11) | NEW |
| Ride Details | `/app/rides/[id]` | Main | detail view | NEW |

## Offer a Ride — Slice A (§7.3)

| Wireframe screen | Route | Region | Components | Status |
|---|---|---|---|---|
| Offer Ride (route form + seats + fare + vehicle picker) | `/app/offer` | Main | form (offerRideFormSchema), SelectField (approved vehicles only) | NEW |
| Route Confirmation | shared with Find | Map | shared map component | NEW |
| Publish Ride | action on `/app/offer` | — | mutation → ride.status=published | NEW |

## Vehicles — Slice A (admin surface D) (§7.10)

| Wireframe screen | Route | Region | Components | Status |
|---|---|---|---|---|
| My Vehicle (list, status) | `/app/vehicles` | Main | DataTable, StatusBadge | NEW (copy _demo) |
| Add / Manage Vehicle | `/app/vehicles` + Dialog | Dialog | form (vehicleFormSchema) | NEW |
| Registered Vehicles (admin, approve/inactive) | `/admin/vehicles` | Main | DataTable, approve action | NEW (D) |
| Vehicle Details | `/admin/vehicles/[id]` | Main | detail view | NEW (D) |

## Trips, tracking & chat — Slice B (§7.5–7.7)

| Wireframe screen | Route | Region | Components | Status |
|---|---|---|---|---|
| My Trips (driver + passenger views) | `/app/trips` | Main | DataTable/cards, StatusBadge (trip lifecycle) | NEW |
| Trip Detail / Information / Summary | `/app/trips/[id]` | Main + Map | detail, driver/vehicle/fare, actions | NEW |
| Live Tracking (moving marker, live route, ETA) | `/app/trips/[id]/track` | Map | Leaflet + Pusher channel (polling fallback) | NEW (headline) |
| Chat with Driver | `/app/trips/[id]` chat panel | Main/Sheet | message thread over Pusher | NEW |
| Call to Driver | button on trip detail | — | `tel:` deep-link | NEW |
| Pay Now | button → payment | — | routes to /app/pay | NEW (→C) |

## Payments & wallet — Slice C (§7.8–7.9, §7.11)

| Wireframe screen | Route | Region | Components | Status |
|---|---|---|---|---|
| Payment Method (Cash/Card/UPI/Wallet, Pay Now) | `/app/pay/[bookingId]` | Main + Dialog | form (paymentFormSchema), Stripe | NEW |
| Wallet (balance, recharge, history) | `/app/wallet` | Main | balance card, recharge (rechargeFormSchema), ledger DataTable | NEW |
| UPI Payment (ID or QR) | recharge dialog | Dialog | QR render | NEW |
| Ride History | `/app/history` | Main | DataTable over completed trips | NEW |
| Reports (Key Metrics, Analytics Charts, Financial Summary) | `/reports` | Main | StatCard, recharts (/dataviz), Financial Summary table | ADAPT (stub exists) |

## Company admin console — Slice D (§7.12)

| Wireframe screen | Route | Region | Components | Status |
|---|---|---|---|---|
| Admin Dashboard | `/admin` | Main | StatCard (org-scoped) | ADAPT |
| Employees (list) | `/admin/users` | Main | DataTable (exists, stub) | ADAPT |
| Employee Details (name/email/department/manager/office) | `/admin/users/[id]` | Main | detail (userFormSchema fields) | NEW |
| Add Employee | `/admin/users` + Dialog | Dialog | form | NEW |
| Platform Access (active/revoked) | action on Employee Details | — | mutation (user:revokeAccess) | NEW |
| Registered Vehicles + approve | `/admin/vehicles` | Main | DataTable, approve | NEW |
| Org Settings (Company Details + Carpooling Configuration + Save) | `/admin/settings` | Main | form (organizationFormSchema), Save | ADAPT (stub exists) |
| Participation monitor | `/admin` widget | Main | computed metrics | NEW |

## Super admin console — Slice D (§7.13)

| Wireframe screen | Route | Region | Components | Status |
|---|---|---|---|---|
| Platform Dashboard (cross-org metrics) | `/platform` | Main | StatCard (cross-tenant) | EXISTS (skeleton) |
| Organizations (list) | `/platform/organizations` | Main | DataTable | NEW |
| Create Org / Invite Admin | `/platform/organizations` + Dialog | Dialog | form (organizationFormSchema + inviteFormSchema) | NEW |

---

## Shared components the slices reuse (don't reinvent)

- **Map** — one Leaflet + OSRM component (Slice A owns, B consumes): polyline, distance/ETA,
  pickup/destination markers. `ride.routeGeoJSON` is cached so tracking reuses the same geometry.
- **DataTable** (`components/data-table`) — every list screen. Search + filter + pagination free.
- **Five states** (`components/states`) — loading/empty/error/success(toast)/StatusBadge on EVERY screen.
- **Form primitives** (`components/form`) — TextField/SelectField/DateField/SwitchField/FileField.
- **StatusBadge** — extend `STATUS_VARIANTS` with the carpooling statuses (ride/booking/trip/payment).
- **Realtime** — one Pusher channel per trip carries BOTH tracking and chat (Slice B owns).
