# Slice D — Tenancy, Admin & Onboarding · Mitesh

Send Mitesh this. He pastes it into Claude Code in his clone, on branch `slice-d-tenancy-admin`.
Note: the tenancy PATTERN already landed in lib/permissions.ts at the sync — Mitesh builds the
CONSOLES and ONBOARDING on top of it (not the pattern itself).

```
You are building SLICE D (Tenancy, Admin & Onboarding) of our Enterprise Carpooling Platform. Read
CLAUDE.md, docs/PRD.md §4/§5/§7.1/§7.12/§7.13, docs/team-ownership.md, docs/wireframe-map.md, and
.claude/skills/rbac-guard/reference.md (tenancy section) first. Work ONLY on branch
slice-d-tenancy-admin. Obey the skills: generic-crud, drizzle-schema, rbac-guard, design-standards,
qa-verify.

The scaffold is DONE and verified — reuse it, never rebuild it. Schema (organization, invitation,
user extensions + enums) is migrated to Neon. The orgId-scoping pattern, requireSuperAdmin, and the
404-not-403 rule ALREADY EXIST in lib/permissions.ts — you consume them; you don't rewrite them.
The /platform (super-admin) and /admin (company-admin) route skeletons already exist and are gated.

MY TABLES (already created): organization, invitation, user extensions. MY ROUTE GROUPS: /platform/*
(super-admin), /admin/* (company-admin), the three onboarding paths. MY API FOLDERS:
app/api/organization, app/api/invitation, app/api/user (admin employee mgmt). MY FEATURE FOLDERS:
features/organization, features/invitation, admin employee/vehicle surfaces. Do NOT touch:
db/schema/index.ts, nav.config.ts, CLAUDE.md, lib/permissions.ts (ask Shivam the integrator for any
statement/nav change), or Slice A/B/C's tables and folders.

THE RULES YOU ENFORCE (this slice IS the reviewer's tenancy story):
- company_admin routes: `const { session, tenant } = await requirePermission("<resource>","<action>")`
  then scope with `scopedWhere(tenant, table, …)`. A company_admin sees ONLY its own org.
- super_admin routes: `const { session, tenant } = await requireSuperAdmin()` — the ONE cross-tenant
  path. Use it for the platform console only.
- Cross-org fetch by id → scoped fetch returns nothing → throw NotFoundError (404, NOT 403). This is
  the headline test — a Globex admin requesting an Acme record gets 404.
- platformAccess === "revoked" is already refused at the guard; wire the revoke action.

BUILD IN THIS ORDER (small, frequent commits; push to slice-d-tenancy-admin):
1. Super-admin platform console — /platform (skeleton exists). Organizations list (/platform/
   organizations, DataTable over ALL orgs via requireSuperAdmin), Create Org + Invite Admin dialog
   (organizationFormSchema + inviteFormSchema in the schema files). Cross-org metrics.
2. Onboarding Path 1 — super_admin creates an org (name, allowedEmailDomains, currency,
   autoApproveDomain) and sends a tokenized invite to the company_admin's email (invitation table,
   generate token + expiresAt). Email via lib/email.ts. Accept-invite screen /accept-invite?token=…
   (acceptInviteSchema): set password → land in the admin console.
3. Company-admin console — /admin (skeleton exists). Admin Dashboard (org-scoped StatCard). Employees
   /admin/users (DataTable exists as a stub — make it real, org-scoped): approval queue, activate/
   deactivate, GRANT/REVOKE platform access (user:revokeAccess), add employee. Employee Details
   /admin/users/[id] showing name/email/department/manager/officeLocation (userFormSchema fields).
4. Onboarding Path 2 — company_admin invites specific employees by email (invitation, role=employee).
5. Onboarding Path 3 — employee self-registers (extend the existing app/api/auth/register): match the
   email domain against every org's allowedEmailDomains → assign that orgId + status="pending". If the
   org's autoApproveDomain is true → status="active" immediately; else it waits in the admin queue.
   Reject a domain that matches no org with a clear message. THREE role redirects after login:
   super_admin → /platform, company_admin → /admin, employee → /dashboard (homeForRole in lib/session).
6. Org settings — /admin/settings (stub exists): Company Details + Carpooling Configuration
   (organizationFormSchema): fuelCostPerKm, travelCostPerKm, maintenanceMonthly, currency,
   allowedEmailDomains, autoApproveDomain, Save. SEAM: Slice C reads this cost config for reports —
   you own the config, C owns the read.
7. Vehicle oversight (admin side) — /admin/vehicles: org-wide DataTable, APPROVE/inactive a vehicle
   (vehicle:approve), register-on-behalf. SEAM: Slice A owns the vehicle table + employee CRUD; you own
   the admin approval surface — coordinate, don't duplicate A's forms.
8. Participation monitor — a computed org-scoped widget on the admin dashboard.

Use <DataTable> for lists, form primitives for forms, the five states on every screen, StatusBadge for
user status. Responsive 375/1440.

SEED LOGINS (password Password123!): superadmin@demo.dev (platform), admin@demo.dev (Acme,
auto-approve org), admin@globex.dev (Globex, approval-queue org). TWO orgs are seeded specifically so
you can demo BOTH approval modes AND the cross-org 404.

DEFINITION OF DONE (qa-verify): two orgs → an Acme admin CANNOT see Globex's anything (404, not 403,
tested AT THE API by hitting the endpoint directly) → admin edits fuel cost → it flows into Slice C's
reports → all three onboarding paths land a user in the right console scoped to the right org. Run the
FOUR mandatory RBAC negatives from rbac-guard/reference.md. typecheck + lint + build clean. Report
DONE/TESTED/BLOCKED/NEXT. You own the orgId pattern's correctness — if any slice leaks across orgs,
flag it.
```
