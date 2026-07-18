import type { Metadata } from "next";
import { Users, Car, Building2, TrendingUp, UserCheck, Clock } from "lucide-react";
import { count, eq, and } from "drizzle-orm";
import Link from "next/link";
import { requireRolePage } from "@/lib/session";
import { scopedWhere } from "@/lib/permissions";
import { db } from "@/db";
import { user, vehicle, ride, organization } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = { title: "Admin Dashboard" };

/**
 * /admin — Company-admin dashboard. Org-scoped StatCards + participation monitor.
 * Every query goes through scopedWhere(tenant, table) — the tenancy pattern enforced in the view layer.
 */
export default async function AdminDashboardPage() {
  const session = await requireRolePage("company_admin");
  const orgId = session.user.orgId;
  const tenant = { userId: session.user.id, orgId: orgId ?? null, role: session.user.role as "company_admin" };

  if (!orgId) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <Building2 className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-lg font-semibold">No Organization Assigned</h1>
        <p className="text-sm text-muted-foreground">Contact the platform super admin to assign you to an org.</p>
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

  return (
    <div>
      <PageHeader
        title={`${orgData?.name ?? "Admin"} Dashboard`}
        description="Your organization's live metrics. All data is scoped to your org."
        action={
          pendingCount > 0 ? (
            <Button asChild variant="outline" size="sm" id="pending-approval-btn">
              <Link href="/admin/users">
                <Clock className="mr-2 h-4 w-4 text-orange-500" />
                {pendingCount} Pending Approval
              </Link>
            </Button>
          ) : null
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Members"
          value={totalUsers}
          icon={Users}
          hint={pendingCount > 0 ? `${pendingCount} pending approval` : "All approved"}
        />
        <StatCard
          label="Vehicles"
          value={totalVehicles}
          icon={Car}
          hint={`${approvedVehicleCount} approved for rides`}
        />
        <StatCard
          label="Published Rides"
          value={rideCount}
          icon={TrendingUp}
          hint="Org-wide, all statuses"
        />
        <StatCard
          label="Participation Rate"
          value={`${participationRate}%`}
          icon={UserCheck}
          hint="Active users with approved vehicles"
        />
      </div>

      {/* Quick-nav */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-primary" />
              User Management
            </CardTitle>
            <CardDescription className="text-xs">
              Approve, activate, or revoke employee access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild id="go-users-btn">
              <Link href="/admin/users">
                Manage Users <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Car className="h-4 w-4 text-primary" />
              Vehicle Oversight
            </CardTitle>
            <CardDescription className="text-xs">
              Approve vehicles and register on behalf.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild id="go-vehicles-btn">
              <Link href="/admin/vehicles">
                Manage Vehicles <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4 text-primary" />
              Org Settings
            </CardTitle>
            <CardDescription className="text-xs">
              Configure fuel costs, domains, and carpooling config.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild id="go-settings-btn">
              <Link href="/admin/settings">
                Open Settings <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Participation Monitor */}
      {orgData && (
        <div className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Onboarding Configuration</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4 text-sm">
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Allowed Domains</p>
                <div className="flex flex-wrap gap-1">
                  {orgData.allowedEmailDomains.length === 0 ? (
                    <span className="text-muted-foreground italic">None configured</span>
                  ) : (
                    orgData.allowedEmailDomains.map((d) => (
                      <Badge key={d} variant="secondary" className="font-mono text-xs">@{d}</Badge>
                    ))
                  )}
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Domain Signups</p>
                <Badge variant={orgData.autoApproveDomain ? "default" : "outline"}>
                  {orgData.autoApproveDomain ? "Auto-approve" : "Approval queue"}
                </Badge>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Currency</p>
                <span className="font-mono font-medium">{orgData.currency}</span>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Fuel Cost / km</p>
                <span className="font-mono font-medium">₹{orgData.fuelCostPerKm}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
