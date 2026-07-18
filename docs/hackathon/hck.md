# 🎯 Hackathon Prep — Mitesh's Role (Slice D)
### Enterprise Carpooling Platform · Odoo × KSV Hackathon

---

## 1. 👤 MY ROLE — What Mitesh Owns

> **"I own the multi-tenancy backbone and both admin consoles."**

**Slice D — Tenancy, Admin & Onboarding**

I am responsible for:
- **How organizations are created and managed** (the tenant root of the whole system)
- **How every user gets into the platform** — all 3 onboarding paths
- **The Super-Admin console** (`/platform`) — cross-org view, create orgs, invite admins
- **The Company-Admin console** (`/admin`) — manage employees, vehicles, settings per org
- **RBAC correctness** — my tenancy pattern ensures no org can see another's data (cross-org = 404, not 403)

**Why this matters:** Every other slice (Ride Engine, Trips, Payments) depends on users having the right `orgId` and `role`. If my code is wrong, the entire app's data isolation breaks. I'm the load-bearing pillar of the architecture.

---

## 2. 🗂️ ARCHITECTURE & WORKFLOW

### The Three-Role System

```
super_admin (no orgId)           → /platform   — cross-tenant console, creates orgs
  └── invites company_admin
      company_admin (orgId = X)  → /admin      — manages own org's users/vehicles/config
          └── invites or employee self-registers
              employee (orgId = X)→ /app       — carpools within their org
```

### Multi-Tenancy Pattern (the core concept)

Every non-super-admin query in the app uses `scopedWhere(tenant, table, extra?)`:

```typescript
// lib/permissions.ts — the single guard function
export function scopedWhere(tenant: Tenant, table: { orgId: unknown }, extra?: SQL) {
  if (tenant.role === "super_admin") return extra;           // cross-tenant: no filter
  const orgClause = eq(table.orgId as never, tenant.orgId); // force org filter
  return extra ? and(orgClause, extra) : orgClause;
}
```

**The golden rule:** Cross-org access returns **404, not 403** (the resource doesn't exist to you).

### The 3 Onboarding Paths

| Path | Who | How | Where they land |
|------|-----|-----|-----------------|
| **Path 1** | super_admin invites company_admin | POST /api/organization (with invite.email) → tokenized email → `/accept-invite?token=…` | `/admin` |
| **Path 2** | company_admin invites employee | POST /api/invitation (role=employee) → tokenized email → `/accept-invite?token=…` | `/app` |
| **Path 3** | Employee self-registers | POST /api/auth/register → email domain matched against org's `allowedEmailDomains` → orgId auto-assigned | `/app` (active if autoApproveDomain=true, else pending) |

---

## 3. 📁 CODE I BUILT (File by File)

### API Routes (`app/api/`)

| File | Purpose |
|------|---------|
| `api/organization/route.ts` | GET all orgs (super_admin) + POST create org |
| `api/organization/[id]/route.ts` | GET/PATCH/DELETE single org — scopedWhere enforces 404 |
| `api/invitation/route.ts` | GET + POST invite — generates token, sends Resend email |
| `api/invitation/[id]/route.ts` | DELETE revoke invite (sets status=expired) |
| `api/invitation/accept/route.ts` | POST accept token → creates user → marks invite accepted |
| `api/user/route.ts` | GET org users + POST add employee (org-scoped) |
| `api/user/[id]/route.ts` | GET/PATCH/DELETE — approve, deactivate, revoke access |
| `api/vehicle/admin/route.ts` | GET org vehicles + POST register-on-behalf |
| `api/vehicle/admin/[id]/route.ts` | PATCH approve/deactivate vehicle |
| `api/auth/register/route.ts` | Extended for Path 3: domain match → orgId → status |

### Pages (`app/(dashboard)/`)

| Route | What it shows |
|-------|--------------|
| `/platform` | KPI tiles (orgs, users, rides, trips) + quick-nav to org management |
| `/platform/organizations` | DataTable ALL orgs + Create Org dialog + Invite Admin dialog |
| `/admin` | Real dashboard: member count, pending approvals, vehicle count, participation % |
| `/admin/users` | Employee management: approval queue, status actions, invite by email |
| `/admin/users/[id]` | Employee detail: contact, work profile, status/access |
| `/admin/settings` | Org settings form: name, domains, auto-approve, fuel/travel cost config |
| `/admin/vehicles` | Vehicle oversight: approve/deactivate inline actions |
| `/accept-invite` | Accept invite form: name + password → auto sign-in |

### Feature Components (`features/`)

| File | Purpose |
|------|---------|
| `features/organization/org-columns.tsx` | DataTable columns for org list |
| `features/organization/org-form.tsx` | Create Org dialog (RHF + Zod) |
| `features/organization/invite-admin-dialog.tsx` | Invite Admin dialog |
| `features/organization/org-settings-form.tsx` | Admin org settings form |
| `features/admin-users/user-columns.tsx` | User table columns + approve/deactivate/revoke inline |
| `features/admin-users/invite-employee-dialog.tsx` | Path 2: admin invites employee by email |
| `features/admin-vehicles/vehicle-admin-table.tsx` | Vehicle approval/deactivation table |

---

## 4. 🔐 RBAC PATTERN — The Key Code

### API Route Guard Pattern
Every API route in Slice D starts with one of two guards:

```typescript
// For super_admin cross-tenant routes:
const { session, tenant } = await requireSuperAdmin();

// For company_admin scoped routes:
const { session, tenant } = await requirePermission("user", "read");
// then always scope with:
.where(scopedWhere(tenant, user))
```

### The 404-not-403 Rule in Action

```typescript
// api/user/[id]/route.ts — the headline test
const row = await db.query.user.findFirst({
  where: scopedWhere(tenant, user, eq(user.id, id)),
});
if (!row) throw new NotFoundError("User not found."); // 404, not ForbiddenError
```

A Globex admin hitting `GET /api/user/{acme-employee-id}` → `scopedWhere` adds `AND orgId = globex-id` → row not found → **404** (the resource doesn't exist to them, not "you don't have permission").

### Revoke Access Flow

```typescript
// Admin clicks "Revoke Platform Access"
PATCH /api/user/{id}  body: { platformAccess: "revoked" }
// Next request by that user goes through requirePermission():
if (session.user.platformAccess === "revoked") {
  throw new ForbiddenError("Your platform access has been revoked.");
}
```

---

## 5. 🏗️ THE 3 SCHEMAS I USE

### `organization` table (the tenant root)
```typescript
{
  id, name,
  allowedEmailDomains: string[],       // Path 3 domain matching
  currency,
  fuelCostPerKm, travelCostPerKm,      // → Slice C reads these for reports
  maintenanceMonthly,
  autoApproveDomain: boolean,           // Path 3 behavior switch
}
```

### `invitation` table (Paths 1 & 2)
```typescript
{
  orgId, email,
  role: "company_admin" | "employee",
  token (unique, 32-byte random),
  status: "pending" | "accepted" | "expired",
  expiresAt  // 7 days from creation
}
```

### `user` table (extended for carpooling)
```typescript
{
  orgId (nullable, only null for super_admin),
  role: "super_admin" | "company_admin" | "employee",
  status: "pending" | "active" | "inactive",    // membership lifecycle
  platformAccess: "active" | "revoked",          // admin-controlled kill switch
  department, manager, officeLocation            // Employee Details fields
}
```

---

## 6. ✅ THE 4 MANDATORY RBAC NEGATIVES

### Test 1: Cross-Org 404 (the headline)
```bash
# Login as admin@globex.dev, get an Acme employee's ID from seeded data
curl -H "Cookie: session=..." GET /api/user/{acme-employee-id}
# Expected: HTTP 404 { "error": { "code": "NOT_FOUND" } }
# NOT: HTTP 403 Forbidden
```

### Test 2: Employee can't access /admin
- Login as `employee@demo.dev` → navigate to `/admin`
- Expected: Automatically redirected to `/app` (homeForRole for employee)

### Test 3: Revoked user can't use the platform
- Admin revokes: `PATCH /api/user/{id}` with `{ platformAccess: "revoked" }`
- That user makes any request → `401`/redirect to `/login?error=access_revoked`

### Test 4: Unauthenticated blocked from /platform
- Navigate to `/platform` without a session
- Expected: Redirect to `/login?callbackUrl=/platform`

---

## 7. 🔗 SEAMS WITH OTHER SLICES

| Seam | What I own | What they consume |
|------|-----------|------------------|
| **Slice C (Shreya — Reports)** | `organization.fuelCostPerKm`, `travelCostPerKm`, `maintenanceMonthly` | Slice C reads these for financial summary reports |
| **Slice A (Shivam — Rides)** | Vehicle `approvalStatus` admin approval surface (`/admin/vehicles`) | Slice A owns employee vehicle CRUD; I own admin approval |
| **Slice B (Hetvi — Trips)** | User `orgId` + `status` on every user | B uses orgId to scope trips/messages/chat |

---

## 8. 🎬 DEMO SCRIPT (For Judges)

### Act 1: Super-Admin Cross-Tenant Console
```
Login: superadmin@demo.dev / Password123!
→ /platform — KPI tiles: 2 orgs, N users, rides, trips
→ /platform/organizations — Acme Mobility + Globex Transit with member counts
→ Click "New Organization" → fill form + optional admin email → creates org
→ Click ⋮ → "Invite Admin" → sends invite email
```

### Act 2: Onboarding Path 1
```
→ After invite email, open /accept-invite?token=... 
→ Fill: name + password → click Accept
→ Lands at /admin (company_admin console for the new org)
```

### Act 3: Company-Admin Dashboard
```
Login: admin@demo.dev / Password123!  (Acme Mobility — auto-approve)
→ /admin — "Acme Mobility Dashboard"
   Active Members: 5 | Vehicles: 4 | Participation: X%
→ Quick-nav cards: User Management, Vehicle Oversight, Settings
→ Onboarding config widget: @acme.dev domain, Auto-approve: ON, ₹7.50/km
```

### Act 4: User Management + CROSS-ORG 404 (headline demo)
```
→ /admin/users — DataTable of 5 employees
→ Filter "Pending" → shows approval queue
→ 3-dot menu → Approve (status=active)
→ 3-dot menu → Revoke Platform Access (platformAccess=revoked)

CROSS-ORG TEST (ask judge to try):
→ Login as admin@globex.dev → Globex admin console
→ Copy an Acme employee's ID from Network tab
→ GET /api/user/{acme-employee-id} → HTTP 404 NOT FOUND
   (not 403 — the resource "doesn't exist" cross-tenant)
```

### Act 5: Onboarding Path 3
```
→ Register: newuser@acme.dev / Name / Password
→ Domain "@acme.dev" matches Acme Mobility (autoApproveDomain=true)
→ User created: status=active, orgId=acme-id
→ Sign in → lands at /app (employee console)

→ Register: newuser@globex.dev
→ Domain "@globex.dev" matches Globex (autoApproveDomain=false)
→ User created: status=pending
→ Globex admin must approve before they can use the app
```

### Act 6: Org Settings → Slice C Seam
```
→ /admin/settings
→ Fuel Cost: 7.50 → 9.00
→ Save → "Settings saved. Slice C's reports will use the updated cost values."
→ (Shreya's Slice C financial reports now use 9.00)
```

---

## 9. 🧠 KEY THINGS TO KNOW FOR JUDGE Q&A

**Q: Why 404 instead of 403 for cross-org access?**
> 404 doesn't leak information. A 403 tells the attacker "that resource exists, you just can't see it." A 404 says "nothing here." This is standard security practice for multi-tenant SaaS apps (e.g., how GitHub, Linear work).

**Q: How does the orgId scoping actually work?**
> Every query goes through `scopedWhere(tenant, table)` which automatically appends `AND orgId = <session.orgId>` to the WHERE clause. It's impossible to forget because the function forces you to call it — you can't "accidentally" fetch cross-tenant data.

**Q: What happens if someone tries to modify their JWT to change their orgId?**
> Auth.js uses database sessions. The session is stored server-side in the `session` table. The JWT only contains an opaque session token. Even if tampered, the server re-validates from the DB.

**Q: How do the 3 onboarding paths differ?**
> Path 1: Super-admin manually creates org + invites admin — always controlled, always lands in `/admin`.
> Path 2: Company-admin invites specific employees by email — admin-controlled, employee lands in `/app`.
> Path 3: Employee self-registers with company email — domain-matching, auto or manual approval based on org config.

**Q: How does role-based navigation work?**
> `lib/session.ts → homeForRole(role)`: super_admin→/platform, company_admin→/admin, employee→/app. Called by Auth.js callbacks after every sign-in. Next.js middleware also protects route groups at the edge.

**Q: How does the invitation token expire?**
> Token is a 32-byte cryptographic random hex string. `expiresAt` is set 7 days from creation. On POST /api/invitation/accept, we check `inv.expiresAt < new Date()` and auto-expire if past. The UI also handles this gracefully.

---

## 10. 📊 METRICS (What I Can Demo with Numbers)

From the seeded data:
- **2 orgs**: Acme Mobility + Globex Transit
- **1 super_admin**: superadmin@demo.dev
- **2 company_admins**: admin@demo.dev (Acme), admin@globex.dev (Globex)
- **6 employees**: employee@, rider@, arjun@, diya@ (Acme) | kabir@, meera@ (Globex)
- **4 vehicles**: 2 per org (Acme=both approved, Globex=1 approved+1 inactive)
- **Acme**: `autoApproveDomain=true` → @acme.dev registers → **instant active**
- **Globex**: `autoApproveDomain=false` → @globex.dev registers → **admin approves**

---

## 11. 📌 COMMIT HISTORY (Slice D)

| Commit | What I built |
|--------|-------------|
| `1ff7364` | API routes: organization, invitation, user, vehicle-admin (9 files) |
| `6140412` | Super-admin platform console + org management + accept-invite (Paths 1&2) |
| `c0119df` | Company-admin console: users, settings, vehicles + Paths 2 & 3 |
| `29d04a2` | Fix: extend PageHeader with icon prop |

**Branch:** `mitesh` → `github.com/ShivamPatel145/Carpooling-Platform/tree/mitesh`

---

*Branch: `mitesh` · Slice: D (Tenancy, Admin & Onboarding) · Hackathon: Odoo × KSV*
