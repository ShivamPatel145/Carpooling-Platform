import type { Metadata } from "next";
import { Building2, Users, CarFront, Route, ArrowRight } from "lucide-react";
import { count } from "drizzle-orm";
import Link from "next/link";
import { requireSuperAdminPage } from "@/lib/session";
import { db } from "@/db";
import { organization, user, ride, trip } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Platform" };

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

  return (
    <div>
      <PageHeader
        title="Platform Console"
        description="Cross-organization overview. Only the super admin sees across all tenants."
        action={
          <Button asChild id="manage-orgs-btn">
            <Link href="/platform/organizations">
              <Building2 className="mr-2 h-4 w-4" />
              Manage Organizations
            </Link>
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Organizations" value={orgs[0]?.n ?? 0} icon={Building2} hint="Registered tenants" />
        <StatCard label="Total users" value={users[0]?.n ?? 0} icon={Users} hint="Across all orgs" />
        <StatCard label="Rides" value={rides[0]?.n ?? 0} icon={CarFront} hint="Published, all orgs" />
        <StatCard label="Trips" value={trips[0]?.n ?? 0} icon={Route} hint="Executed, all orgs" />
      </div>

      {/* Quick-nav cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="group hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" />
              Organizations
            </CardTitle>
            <CardDescription>
              Create tenants, manage their settings, and invite company admins.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild size="sm" id="go-orgs-btn">
              <Link href="/platform/organizations">
                Open Organizations <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              Activity Log
            </CardTitle>
            <CardDescription>
              Cross-tenant audit trail. Every action, every org, one view.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild size="sm" id="go-activity-btn">
              <Link href="/platform/activity">
                Open Activity <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
