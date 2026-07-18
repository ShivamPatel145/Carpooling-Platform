import type { Metadata } from "next";
import Link from "next/link";
import { count, eq, and } from "drizzle-orm";
import {
  Users,
  Car,
  Building2,
  TrendingUp,
  UserCheck,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { requireRolePage } from "@/lib/session";
import { scopedWhere } from "@/lib/permissions";
import { db } from "@/db";
import { user, vehicle, ride, organization } from "@/db/schema";
import { coCard, CoAvatar, coInitials } from "@/components/co/ui";

export const metadata: Metadata = { title: "Admin Console" };

/**
 * /admin — Company-admin console (Coride). Org-scoped KPIs, a pending-approvals queue and a
 * participation-by-department monitor. Every query goes through scopedWhere(tenant, table) — the
 * tenancy pattern enforced in the view layer. No figure is fabricated (design-standards §1).
 */
export default async function AdminDashboardPage() {
  const session = await requireRolePage("company_admin");
  const orgId = session.user.orgId;
  const tenant = { userId: session.user.id, orgId: orgId ?? null, role: session.user.role as "company_admin" };

  if (!orgId) {
    return (
      <div className={`${coCard} mx-auto mt-10 flex max-w-md flex-col items-center gap-3 px-6 py-14 text-center`}>
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--surface-2)] text-[color:var(--ink-2)]">
          <Building2 className="h-6 w-6" strokeWidth={1.6} />
        </span>
        <h1 className="m-0 font-display text-[18px] font-semibold text-[color:var(--ink)]">
          No organisation assigned
        </h1>
        <p className="m-0 text-[14px] text-[color:var(--ink-2)]">
          Contact the platform super admin to assign you to an org.
        </p>
      </div>
    );
  }

  const [
    activeUsers,
    pendingUsers,
    orgVehicles,
    approvedVehicles,
    orgRides,
    orgData,
    pendingVehicles,
    deptRows,
  ] = await Promise.all([
    db.select({ n: count() }).from(user).where(
      and(scopedWhere(tenant, user), eq(user.status, "active"))
    ),
    db.select({ n: count() }).from(user).where(
      and(scopedWhere(tenant, user), eq(user.status, "pending"))
    ),
    db.select({ n: count() }).from(vehicle).where(scopedWhere(tenant, vehicle)),
    db.select({ n: count() }).from(vehicle).where(
      and(scopedWhere(tenant, vehicle), eq(vehicle.approvalStatus, "approved"))
    ),
    db.select({ n: count() }).from(ride).where(scopedWhere(tenant, ride)),
    db.query.organization.findFirst({ where: eq(organization.id, orgId) }),
    db
      .select({
        id: vehicle.id,
        model: vehicle.model,
        registrationNo: vehicle.registrationNo,
        ownerName: user.name,
      })
      .from(vehicle)
      .innerJoin(user, eq(vehicle.ownerId, user.id))
      .where(and(scopedWhere(tenant, vehicle), eq(vehicle.approvalStatus, "inactive")))
      .limit(5),
    db
      .select({ dept: user.department, n: count() })
      .from(user)
      .where(and(scopedWhere(tenant, user), eq(user.status, "active")))
      .groupBy(user.department),
  ]);

  const totalUsers = activeUsers[0]?.n ?? 0;
  const pendingCount = pendingUsers[0]?.n ?? 0;
  const totalVehicles = orgVehicles[0]?.n ?? 0;
  const approvedVehicleCount = approvedVehicles[0]?.n ?? 0;
  const rideCount = orgRides[0]?.n ?? 0;

  // Participation rate: percentage of active users who have an approved vehicle (drivers)
  const participationRate = totalUsers > 0
    ? Math.round((approvedVehicleCount / totalUsers) * 100)
    : 0;

  // Department participation — active members grouped by department, nulls → "Unassigned", desc.
  const departments = deptRows
    .map((r) => ({ label: r.dept?.trim() || "Unassigned", n: r.n }))
    .sort((a, b) => b.n - a.n);
  const deptMax = Math.max(1, ...departments.map((d) => d.n));

  const kpis: { label: string; value: string; sub: string; Icon: LucideIcon }[] = [
    {
      label: "Active Members",
      value: String(totalUsers),
      sub: pendingCount > 0 ? `${pendingCount} pending approval` : "All approved",
      Icon: Users,
    },
    { label: "Vehicles", value: String(totalVehicles), sub: `${approvedVehicleCount} approved`, Icon: Car },
    { label: "Published Rides", value: String(rideCount), sub: "Org-wide, all statuses", Icon: TrendingUp },
    {
      label: "Participation Rate",
      value: `${participationRate}%`,
      sub: "Active users with vehicles",
      Icon: UserCheck,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="m-0 font-display text-[clamp(22px,3vw,28px)] font-bold tracking-[-0.02em] text-[color:var(--ink)]">
          {orgData?.name ?? "Admin"} Console
        </h2>
        <p className="m-0 mt-1 text-[15px] text-[color:var(--ink-2)]">
          Your organisation&apos;s live carpooling activity — every figure scoped to your org.
        </p>
      </div>

      {/* KPI cards */}
      <div className="mb-[22px] grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
        {kpis.map(({ label, value, sub, Icon }) => (
          <div key={label} className={`${coCard} p-5`}>
            <div className="mb-3.5 flex items-center justify-between">
              <span className="text-[12.5px] text-[color:var(--ink-3)]">{label}</span>
              <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-[color:var(--surface-2)] text-[color:var(--ink-2)]">
                <Icon className="h-4 w-4" strokeWidth={1.6} />
              </span>
            </div>
            <div className="mb-1.5 font-mono text-[24px] font-semibold tracking-[-0.01em] text-[color:var(--ink)]">
              {value}
            </div>
            <div className="text-[12px] text-[color:var(--ink-3)]">{sub}</div>
          </div>
        ))}
      </div>

      {/* Pending approvals + Participation by department */}
      <div className="mb-[22px] grid gap-4 lg:grid-cols-2">
        {/* Pending approvals */}
        <div className={`${coCard} p-5`}>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <div className="font-display text-[15px] font-semibold text-[color:var(--ink)]">
              Pending approvals
            </div>
            <Link
              href="/admin/vehicles"
              className="inline-flex items-center gap-1 font-mono text-[12.5px] text-[color:var(--amber-strong)] transition hover:brightness-[1.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--amber)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface)]"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {pendingVehicles.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[color:var(--ink-3)]">
              No vehicles awaiting approval.
            </p>
          ) : (
            <ul className="flex flex-col">
              {pendingVehicles.map((v, i) => (
                <li
                  key={v.id}
                  className={`flex items-center gap-3.5 py-3 ${i > 0 ? "border-t border-[color:var(--line)]" : ""}`}
                >
                  <CoAvatar initials={coInitials(v.ownerName)} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold text-[color:var(--ink)]">{v.model}</div>
                    <div className="truncate font-mono text-[12px] text-[color:var(--ink-3)]">
                      {v.registrationNo} · {v.ownerName ?? "Unknown owner"}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Participation by department */}
        <div className={`${coCard} p-5`}>
          <div className="mb-4 font-display text-[15px] font-semibold text-[color:var(--ink)]">
            Participation by department
          </div>
          {departments.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[color:var(--ink-3)]">
              No active members to chart yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-3.5">
              {departments.map((d) => (
                <li key={d.label}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className="truncate text-[13px] text-[color:var(--ink-2)]">{d.label}</span>
                    <span className="shrink-0 font-mono text-[13px] font-semibold text-[color:var(--ink)]">
                      {d.n}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--surface-2)]">
                    <div
                      className="h-full rounded-full bg-[color:var(--amber-strong)]"
                      style={{ width: `${Math.max(6, (d.n / deptMax) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick-nav */}
      <div className="grid gap-4 sm:grid-cols-3">
        <NavCard
          href="/admin/users"
          title="Manage Users"
          desc="Approve, activate, or revoke employee access."
          Icon={Users}
        />
        <NavCard
          href="/admin/vehicles"
          title="Vehicle Oversight"
          desc="Approve vehicles and register on behalf."
          Icon={Car}
        />
        <NavCard
          href="/admin/settings"
          title="Org Settings"
          desc="Configure fuel costs, domains, and carpooling."
          Icon={Building2}
        />
      </div>
    </div>
  );
}

function NavCard({
  href,
  title,
  desc,
  Icon,
}: {
  href: string;
  title: string;
  desc: string;
  Icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className={`${coCard} group flex min-h-[150px] flex-col gap-3.5 p-6 transition hover:-translate-y-[3px] hover:border-[color:var(--line-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--amber)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--page)]`}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--surface-2)] text-[color:var(--ink)]">
        <Icon className="h-[22px] w-[22px]" strokeWidth={1.6} />
      </span>
      <div className="flex-1">
        <div className="mb-1 font-display text-[18px] font-semibold text-[color:var(--ink)]">{title}</div>
        <div className="text-[13.5px] text-[color:var(--ink-2)]">{desc}</div>
      </div>
      <div className="flex items-center gap-1.5 font-mono text-[13px] text-[color:var(--amber-strong)]">
        Open <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </Link>
  );
}
