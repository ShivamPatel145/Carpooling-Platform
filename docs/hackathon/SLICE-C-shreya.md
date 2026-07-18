# Slice C — Payments, Wallet & Reports · Shreya (also design driver)

Send Shreya this. She pastes it into Claude Code in her clone, on branch `slice-c-payments-reports`.
(Design-driver note: run /design-sync + publish, then drive Claude Design FIRST — your slice is
lightest until hour 4, which is the room Design needs. See the Claude Design brief separately.)

```
You are building SLICE C (Payments, Wallet & Reports) of our Enterprise Carpooling Platform. Read
CLAUDE.md, docs/PRD.md §7.8/§7.9/§7.11, docs/team-ownership.md, docs/wireframe-map.md first. Work
ONLY on branch slice-c-payments-reports. Obey the skills: generic-crud, drizzle-schema, rbac-guard,
design-standards, qa-verify, and /dataviz for charts. Self-contained + pipeline-rich (PDF + charts
already exist in the scaffold).

The scaffold is DONE and verified — reuse it, never rebuild it. Schema (payment, walletEntry + enums)
is migrated to Neon. The @react-pdf worker-thread pipeline works (lib/pdf/, app/api/demo-entity/[id]/
invoice is the reference). recharts is installed. RBAC + tenancy live in lib/permissions.ts.

MY TABLES (already created): payment, walletEntry, plus the computed report read-model (no report
table — reports are queries). MY ROUTE GROUP: /app/pay, /app/wallet, /app/history, /reports. MY API
FOLDERS: app/api/payment, app/api/wallet, app/api/stripe/webhook, app/api/report. MY FEATURE FOLDERS:
features/payment, features/wallet, features/report. Do NOT touch: db/schema/index.ts, nav.config.ts,
CLAUDE.md, lib/permissions.ts (ask Shivam the integrator), or Slice A/B/D's tables and folders.

TENANCY IS MANDATORY on every query:
- `const { session, tenant } = await requirePermission("<resource>","<action>")`; scope with
  `scopedWhere(tenant, payment, …)`; set `orgId: tenant.orgId` on inserts; cross-org → 404 not 403;
  close mutations with logActivity({ orgId: tenant.orgId, ... }).

BUILD IN THIS ORDER (small, frequent commits; push to slice-c-payments-reports):
1. Wallet ledger — the walletEntry table is APPEND-ONLY: balance = sum(delta); NEVER update/delete a
   row. Recharge = positive entry; spend = negative entry; refund = positive. Compute balanceAfter at
   insert time. Wallet screen /app/wallet: balance card, recharge (rechargeFormSchema: amount +
   Card/UPI), transaction history (DataTable over walletEntry), UPI-with-QR in the recharge dialog.
2. Stripe (test mode) — recharge funds a positive walletEntry via a Stripe PaymentIntent. `pnpm add
   stripe @stripe/stripe-js`. Env: STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
   STRIPE_WEBHOOK_SECRET (ask Shivam). Webhook app/api/stripe/webhook updates payment.status +
   inserts the walletEntry on success. TEST THE WEBHOOK ON THE DEPLOYED URL early, not localhost.
3. Payment on trip completion — SEAM: Slice B signals a completed trip (status payment_pending); I own
   the trigger. Payment screen /app/pay/[bookingId] (paymentFormSchema): Cash/Card/UPI/Wallet. Paying
   from wallet inserts a negative walletEntry; paying by card goes through Stripe. Each payment writes
   a payment row. On success advance the trip to payment_completed (coordinate with B's transition API).
4. Ride history — /app/history: a read model over completed trips + rides (scopedWhere, per-user). Both
   participants see it with correct details. DataTable + detail.
5. Reports & analytics — /reports. Computed over trip + ride + vehicle + walletEntry (orgId-scoped).
   Key Metrics cards (total fuel cost = distance × org.fuelCostPerKm, profit, vehicle utilization),
   Analytics Charts (recharts via /dataviz, colorblind-safe palette): fuel-efficiency trend,
   vehicle-wise cost. Financial Summary TABLE: monthly Revenue / Fuel Cost / Maintenance / Net Profit —
   revenue from walletEntry ride-payments, fuel/travel from org cost config × distance, maintenance from
   org.maintenanceMonthly. SEAM: org cost config comes from Slice D — I own the read. Employee sees
   personal; company_admin sees org-wide.
6. PDF report/receipt — reuse the worker-thread pipeline (lib/pdf/render.ts + a worker .cjs like
   invoice.worker.cjs). Render a trip receipt or a monthly report PDF. Do NOT move react-pdf rendering
   back into a bundled module (it hits React #31 — the worker pattern is why it works).

Use <DataTable> for lists, form primitives, the five states on every screen, StatusBadge for payment
status. Money is numeric → z.coerce.number in Zod, format with ₹ (org currency = INR). Responsive
375/1440.

SEED LOGIN: rider@demo.dev / Password123! (org "Acme Mobility") — has a wallet recharge entry already;
admin@demo.dev sees org-wide reports; org cost config is seeded (fuelCostPerKm 7.50, etc.).

DEFINITION OF DONE (qa-verify): complete a trip → pay via BOTH wallet AND Stripe test card → balance
updates → trip in history → analytics moves → the webhook updates payment.status ON THE DEPLOYED URL.
RBAC negative AT THE API: a Globex user cannot read an Acme payment/wallet by id (404). typecheck +
lint + build clean. Report DONE/TESTED/BLOCKED/NEXT. Ask Shivam for nav/keys.
```
