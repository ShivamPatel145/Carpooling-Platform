import type { Metadata } from "next";
import { Building2, Users, CarFront, Route } from "lucide-react";
import { count } from "drizzle-orm";
import { requireSuperAdminPage } from "@/lib/session";
import { db } from "@/db";
import { organization, user, ride, trip } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Platform" };

/**
 * Super-admin platform overview — the ONE cross-tenant surface (no orgId scoping, by design).
 * Real platform-wide counts across ALL orgs. The full console (Organizations list, create-org +
 * invite-admin) is Slice D build-day. See docs/PRD.md §7.13.
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

  return (
    <div>
      <PageHeader
        title="Platform"
        description="Cross-organization overview. Only the super admin sees across tenants."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Organizations" value={orgs[0]?.n ?? 0} icon={Building2} hint="Registered tenants" />
        <StatCard label="Total users" value={users[0]?.n ?? 0} icon={Users} hint="Across all orgs" />
        <StatCard label="Rides" value={rides[0]?.n ?? 0} icon={CarFront} hint="Published, all orgs" />
        <StatCard label="Trips" value={trips[0]?.n ?? 0} icon={Route} hint="Executed, all orgs" />
      </div>

      <div className="mt-6">
        <ComingSoon
          icon={Building2}
          slice="Slice D · Super Admin"
          builtOn="the organization + invitation tables and requireSuperAdmin (create org, invite a company admin, view per-org metrics)"
        />
      </div>
    </div>
  );
}
