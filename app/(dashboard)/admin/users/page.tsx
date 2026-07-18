import type { Metadata } from "next";
import { Users } from "lucide-react";
import { eq } from "drizzle-orm";
import { requireRolePage } from "@/lib/session";
import { scopedWhere } from "@/lib/permissions";
import { db } from "@/db";
import { user } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { userColumns } from "@/features/admin-users/user-columns";
import { InviteEmployeeDialog } from "@/features/admin-users/invite-employee-dialog";

export const metadata: Metadata = { title: "Users" };

/**
 * /admin/users — company_admin user management.
 * Org-scoped via scopedWhere — the admin sees ONLY their own org's employees.
 * Approval queue (pending), activate/deactivate, revoke/grant platform access.
 */
export default async function AdminUsersPage() {
  const session = await requireRolePage("company_admin");
  const tenant = {
    userId: session.user.id,
    orgId: session.user.orgId ?? null,
    role: session.user.role as "company_admin",
  };

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      platformAccess: user.platformAccess,
      department: user.department,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(scopedWhere(tenant, user));

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage employees, approve registrations, and control platform access."
        icon={Users}
        action={<InviteEmployeeDialog />}
      />
      <DataTable
        columns={userColumns}
        data={rows}
        searchColumn="name"
        searchPlaceholder="Search by name or email…"
        facets={[
          {
            columnId: "status",
            title: "Status",
            options: [
              { label: "Pending", value: "pending" },
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ],
          },
          {
            columnId: "role",
            title: "Role",
            options: [
              { label: "Employee", value: "employee" },
              { label: "Company Admin", value: "company_admin" },
            ],
          },
        ]}
        emptyTitle="No employees yet"
        emptyDescription="Invite employees by email or they can self-register using your org's domain."
      />
    </div>
  );
}
