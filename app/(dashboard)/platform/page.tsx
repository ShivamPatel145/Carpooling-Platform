import type { Metadata } from "next";
import { Building2, Users, CarFront, Route, ArrowRight, ScrollText, type LucideIcon } from "lucide-react";
import { count } from "drizzle-orm";
import Link from "next/link";
import { requireSuperAdminPage } from "@/lib/session";
import { db } from "@/db";
import { organization, user, ride, trip } from "@/db/schema";
import { coCard, coAmberBtn } from "@/components/co/ui";

export const metadata: Metadata = { title: "Platform" };

const nf = (n: number) => n.toLocaleString("en-IN");

/**
 * Super-admin platform overview — the ONE cross-tenant surface (no orgId scoping, by design).
 * Shows platform-wide KPIs and links to the Organizations management console.
 */
export default async function PlatformPage() {
  await requireSuperAdminPage();

  // Cross-tenant reads — deliberately NOT org-scoped (this is the audited exception).
  const [orgs, users, rides, trips] = await Promise.all([
    db.select({ n: count() }).from(organization),
    db.select({ n: count() }).from(user),
    db.select({ n: count() }).from(ride),
    db.select({ n: count() }).from(trip),
  ]);

  const kpis = [
    { label: "Organizations", value: nf(orgs[0]?.n ?? 0), sub: "Registered tenants", Icon: Building2 },
    { label: "Total users", value: nf(users[0]?.n ?? 0), sub: "Across all orgs", Icon: Users },
    { label: "Rides", value: nf(rides[0]?.n ?? 0), sub: "Published, all orgs", Icon: CarFront },
    { label: "Trips", value: nf(trips[0]?.n ?? 0), sub: "Executed, all orgs", Icon: Route },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="m-0 font-display text-[clamp(22px,3vw,28px)] font-bold tracking-[-0.02em] text-[color:var(--ink)]">
            Platform Console
          </h2>
          <p className="m-0 mt-1 text-[15px] text-[color:var(--ink-2)]">
            Every organisation on Coride, at a glance.
          </p>
        </div>
        <Link
          href="/platform/organizations"
          id="manage-orgs-btn"
          className={`${coAmberBtn} shrink-0 px-[18px] py-2.5 text-[14px]`}
        >
          <Building2 className="h-4 w-4" strokeWidth={1.8} />
          Manage organizations
        </Link>
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

      {/* Quick-nav cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NavCard
          href="/platform/organizations"
          id="go-orgs-btn"
          title="Organizations"
          desc="Create tenants, manage their settings, and invite company admins."
          cta="Open Organizations"
          Icon={Building2}
        />
        <NavCard
          href="/platform/activity"
          id="go-activity-btn"
          title="Activity Log"
          desc="Cross-tenant audit trail. Every action, every org, one view."
          cta="Open Activity"
          Icon={ScrollText}
        />
      </div>
    </div>
  );
}

function NavCard({
  href,
  id,
  title,
  desc,
  cta,
  Icon,
}: {
  href: string;
  id: string;
  title: string;
  desc: string;
  cta: string;
  Icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      id={id}
      className={`${coCard} group flex min-h-[160px] flex-col gap-3.5 p-6 transition hover:-translate-y-[3px] hover:border-[color:var(--line-2)]`}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--surface-2)] text-[color:var(--ink)]">
        <Icon className="h-[22px] w-[22px]" strokeWidth={1.6} />
      </span>
      <div className="flex-1">
        <div className="mb-1.5 font-display text-[20px] font-semibold text-[color:var(--ink)]">{title}</div>
        <div className="text-[14px] text-[color:var(--ink-2)]">{desc}</div>
      </div>
      <div className="flex items-center gap-1.5 font-mono text-[13px] text-[color:var(--amber-strong)]">
        {cta} <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </Link>
  );
}
