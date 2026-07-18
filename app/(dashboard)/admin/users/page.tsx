import type { Metadata } from "next";
import { count } from "drizzle-orm";
import { requireRolePage } from "@/lib/session";
import { scopedWhere } from "@/lib/permissions";
import { db } from "@/db";
import { user, ride } from "@/db/schema";
import { DataTable } from "@/components/data-table";
import { userColumns, type UserRow } from "@/features/admin-users/user-columns";
import { InviteEmployeeDialog } from "@/features/admin-users/invite-employee-dialog";

export const metadata: Metadata = { title: "Employees" };

/**
 * /admin/users — company_admin user management (Coride design).
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

  const [rows, rideCounts] = await Promise.all([
    db
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
      .where(scopedWhere(tenant, user)),
    // Real rides-offered count per driver, org-scoped — no fabricated figures.
    db
      .select({ driverId: ride.driverId, n: count() })
      .from(ride)
      .where(scopedWhere(tenant, ride))
      .groupBy(ride.driverId),
  ]);

  const ridesByUser = new Map<string, number>();
  for (const r of rideCounts) ridesByUser.set(r.driverId, r.n);

  const data: UserRow[] = rows.map((r) => ({
    ...r,
    ridesCount: ridesByUser.get(r.id) ?? 0,
  }));

  return (
    <div>
      {/* Coride page header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="m-0 font-display text-[clamp(22px,3vw,28px)] font-bold tracking-[-0.02em] text-[color:var(--ink)]">
            Employees
          </h2>
          <p className="m-0 mt-1 text-[15px] text-[color:var(--ink-2)]">
            Approve, activate, and manage access for everyone in your organisation.
          </p>
        </div>
        <InviteEmployeeDialog />
      </div>

      <DataTable
        columns={userColumns}
        data={data}
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
