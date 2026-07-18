import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft, Mail, Phone, Building2, User2 } from "lucide-react";
import Link from "next/link";
import { requireRolePage } from "@/lib/session";
import { scopedWhere } from "@/lib/permissions";
import { db } from "@/db";
import { user } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/states/status-badge";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Employee Details" };

/**
 * /admin/users/[id] — Employee Details.
 * scopedWhere ensures the admin can ONLY view employees in their own org.
 * Cross-org request → notFound() (404, not 403) — the headline isolation test.
 */
export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireRolePage("company_admin");
  const tenant = {
    userId: session.user.id,
    orgId: session.user.orgId ?? null,
    role: session.user.role as "company_admin",
  };

  const emp = await db.query.user.findFirst({
    where: scopedWhere(tenant, user, eq(user.id, id)),
  });

  if (!emp) notFound(); // Cross-org: 404 not 403

  return (
    <div>
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Link>
        </Button>
      </div>

      <PageHeader
        title={emp.name ?? emp.email}
        description={`${emp.role === "company_admin" ? "Company Admin" : "Employee"} • ${emp.department ?? "No department"}`}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <User2 className="h-4 w-4 text-primary" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{emp.email}</span>
            </div>
            {emp.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{emp.phone}</span>
              </div>
            )}
            {emp.officeLocation && (
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{emp.officeLocation}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Work Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4 text-primary" />
              Work Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Department</span>
              <span className="font-medium">{emp.department ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Manager</span>
              <span className="font-medium">{emp.manager ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Office</span>
              <span className="font-medium">{emp.officeLocation ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Joined</span>
              <span className="font-medium">{emp.createdAt.toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Status & Access */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Status &amp; Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Membership Status</span>
              <StatusBadge status={emp.status} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Platform Access</span>
              {emp.platformAccess === "revoked" ? (
                <Badge variant="destructive" className="text-xs">Revoked</Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-green-600 border-green-300">Active</Badge>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Role</span>
              <Badge variant="secondary" className="text-xs capitalize">
                {emp.role.replace("_", " ")}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
