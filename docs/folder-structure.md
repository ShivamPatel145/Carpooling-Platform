# Folder Structure

Annotated tree of the repo. Import alias `@/*` → repo root (e.g. `@/lib/...`, `@/components/...`,
`@/db`). One-line purpose per folder.

```text
.
├── app/                          # Next.js App Router — routes, layouts, API
│   ├── (auth)/                   #   route group: login, register, auth actions (own layout)
│   ├── (dashboard)/              #   route group: signed-in app (dashboard, app/*, admin/*, platform/*)
│   │   ├── app/                  #     employee mode-switcher: find/offer/rides/vehicles/trips
│   │   ├── pay/ wallet/ history/ #     employee payments, wallet, ride history
│   │   ├── reports/ settings/ support/ notifications/  # reports, settings, help, notifications
│   │   ├── admin/                #     company-admin console (users, vehicles, settings, activity)
│   │   └── platform/             #     super-admin console (organizations)
│   ├── api/                      #   REST route handlers (see docs/api.md)
│   │   ├── auth/                 #     Auth.js handler + credentials register
│   │   ├── vehicle/ ride/ booking/  # Slice A ride engine (reference CRUD shape)
│   │   ├── trip/ saved-place/ message/ pusher/  # Slice B trips, tracking, chat, realtime auth
│   │   ├── payment/ wallet/ stripe/ report/ history/  # Slice C payments, wallet, webhook, reports
│   │   ├── organization/ invitation/ user/  # Slice D tenancy & admin
│   │   ├── activity-log/         #     audit-trail read endpoint (company-admin+)
│   │   ├── notifications/        #     notifications stats (unread count)
│   │   └── uploadthing/          #     UploadThing file router
│   ├── layout.tsx                #   root layout (fonts, providers, theme) — SHARED, integrator
│   ├── page.tsx                  #   public landing page
│   └── globals.css               #   Tailwind base + CSS variables
│
├── components/                   # React components, grouped by role
│   ├── ui/                       #   shadcn/ui primitives (button, dialog, table, …) — vendored
│   ├── states/                   #   loading / empty / error / status-badge states
│   ├── form/                     #   RHF field wrappers (text/select/date/switch/file) over ui/form
│   ├── data-table/               #   TanStack Table shell (pagination, filters, column header)
│   ├── shell/                    #   app chrome: dashboard shell, nav, mobile nav, user menu, bell
│   ├── auth/                     #   login / register / google-button forms
│   ├── dashboard/                #   dashboard widgets (stat-card)
│   ├── marketing/                #   public site chrome (public header)
│   ├── motion/                   #   Framer Motion helpers (reveal)
│   └── *.tsx                     #   app-wide singletons: providers, theme-toggle, page-header,
│                                 #     coming-soon (used everywhere; not tied to one group)
│
├── features/                     # Vertical feature slices — one folder per entity
│   ├── vehicle/                  #   REFERENCE slice — org-scoped CRUD; copy this for a new entity
│   │   ├── schema.ts             #     ONE Zod schema, re-exported from the db table
│   │   ├── hooks.ts              #     TanStack Query hooks
│   │   ├── columns.tsx           #     DataTable column defs
│   │   ├── form.tsx              #     create/edit form
│   │   ├── index.ts              #     barrel
│   │   └── components/           #     list / create-dialog / row-actions
│   ├── ride/                     #   Slice A — offer/find/book engine (+ RouteMap, location field)
│   ├── trip/ message/ saved-place/  # Slice B — trips, tracking, chat, saved places
│   ├── payment/ wallet/ report/ history/  # Slice C — payments, wallet, reports, ride history
│   ├── organization/ user/         #   Slice D — tenancy & admin (admin vehicle table lives in vehicle/)
│   └── activity-log/             #   read-only audit-trail slice (viewer over the generic table)
│
├── db/                           # Database layer (Drizzle + Neon)
│   ├── schema/                   #   one file per table + barrel index.ts (see docs/database.md)
│   ├── migrations/               #   drizzle-kit generated SQL (+ meta/) — do not hand-edit
│   ├── index.ts                  #   db client + query helper
│   ├── migrate.ts                #   `pnpm db:migrate` runner
│   └── seed.ts                   #   `pnpm db:seed` demo data
│
├── lib/                          # Framework-agnostic logic + cross-cutting utilities
│   ├── permissions.ts            #   RBAC single source of truth (statement/roles/guards)
│   ├── session.ts                #   server-component auth (requireSession/RolePage/PermissionPage)
│   ├── api.ts                    #   withErrorHandler + response helpers + error envelope
│   ├── errors.ts                 #   typed AppError subclasses
│   ├── activity.ts               #   logActivity — the only writer of the audit trail
│   ├── email.ts                  #   Resend send wrapper
│   ├── uploadthing.ts            #   UploadThing client helpers
│   ├── pdf/                      #   @react-pdf/renderer: render.ts + document components
│   ├── fetcher.ts                #   typed client fetch (consumes the error envelope)
│   ├── design-tokens.ts          #   design tokens (accent is the one swappable value)
│   ├── env.ts                    #   validated env access
│   ├── logger.ts                 #   structured logging
│   ├── client-features.ts        #   client-safe feature flags
│   └── utils.ts                  #   cn(), formatDate, humanize, shortId, …
│
├── hooks/                        # Reusable client hooks (use-debounce, use-media-query, use-toast)
├── emails/                       # React Email templates (notification-email.tsx)
├── types/                        # Global TS types + next-auth module augmentation
├── public/                       # Static assets
│
├── docs/                         # This documentation
│   ├── PRD.md                    #   the build spec — single source of truth
│   ├── design-standards.md       #   visual design law (do not overwrite)
│   ├── team-ownership.md         #   who owns which slice / tables / routes
│   ├── wireframe-map.md          #   1:1 map from wireframe screens to routes
│   └── wireframe/                #   the ODOO Excalidraw wireframe (reference mockup)
│
├── .claude/skills/               # Project skills that gate conventions
│   ├── design-standards/         #   visual law
│   ├── drizzle-schema/           #   DB/table conventions
│   ├── generic-crud/             #   wiring an entity into the CRUD primitives
│   ├── rbac-guard/               #   the RBAC pattern
│   ├── qa-verify/                #   verification contract
│   ├── reviewer-doc/             #   reviewer-prep upkeep
│   └── project-type-picker/      #   design artifact routing
│
├── nav.config.ts                 # sidebar nav (config array) — SHARED, integrator only
├── dashboard.config.ts           # dashboard widgets (config array) — SHARED, integrator only
├── homepage.config.ts            # landing sections + copy (config array) — SHARED, integrator only
├── auth.ts / auth.config.ts      # Auth.js setup (config split for edge-safe middleware)
├── middleware.ts                 # edge middleware (cookie presence only)
├── drizzle.config.ts             # drizzle-kit config
├── tailwind.config.ts            # Tailwind v3 config
├── components.json               # shadcn/ui config
└── package.json                  # scripts + deps (see docs/environment-setup.md)
```

> `.claude/skills` contains the seven skills listed above. This tree reflects the repo as it
> actually stands.

## Where does my code go?

| I'm building…              | Put it in…                                                    |
| -------------------------- | ------------------------------------------------------------- |
| A new entity's screens     | `features/<entity>/` (copy `features/vehicle/`)               |
| A new entity's table       | `db/schema/<entity>.ts` (+ barrel line via integrator)        |
| A new entity's API         | `app/api/<entity>/` (copy the `vehicle` route shape)          |
| A new page/route           | `app/(dashboard)/…` (or a new route group)                    |
| Shared UI primitive        | `components/ui/` (prefer shadcn) or `components/<group>/`     |
| Cross-cutting logic        | `lib/…` (route through an existing utility — don't duplicate) |
| A reusable client hook     | `hooks/`                                                      |
| A cross-cutting convention | a skill under `.claude/skills/` (integrator)                  |
