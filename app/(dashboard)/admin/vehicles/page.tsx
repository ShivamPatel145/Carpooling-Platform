import type { Metadata } from "next";
import { Car } from "lucide-react";
import { requireRolePage } from "@/lib/session";
import { scopedWhere } from "@/lib/permissions";
import { db } from "@/db";
import { vehicle, user } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { VehicleAdminTable } from "@/features/admin-vehicles/vehicle-admin-table";

export const metadata: Metadata = { title: "Vehicles" };

/**
 * /admin/vehicles — Vehicle oversight for company_admin.
 * Org-scoped via scopedWhere. Admin sees ALL org vehicles (approved + inactive/pending).
 * Can APPROVE or deactivate vehicles; can register on behalf of an employee.
 * SEAM with Slice A: Slice A owns employee-facing vehicle CRUD. This is the admin approval surface.
 */
export default async function AdminVehiclesPage() {
  const session = await requireRolePage("company_admin");
  const tenant = {
    userId: session.user.id,
    orgId: session.user.orgId ?? null,
    role: session.user.role as "company_admin",
  };

  const vehicles = await db
    .select({
      id: vehicle.id,
      model: vehicle.model,
      registrationNo: vehicle.registrationNo,
      seatingCapacity: vehicle.seatingCapacity,
      approvalStatus: vehicle.approvalStatus,
      orgId: vehicle.orgId,
      ownerId: vehicle.ownerId,
      createdAt: vehicle.createdAt,
    })
    .from(vehicle)
    .where(scopedWhere(tenant, vehicle));

  // Fetch owner names for display
  const ownerIds = [...new Set(vehicles.map((v) => v.ownerId))];
  const owners = ownerIds.length > 0
    ? await db
        .select({ id: user.id, name: user.name, email: user.email })
        .from(user)
        .where(scopedWhere(tenant, user))
    : [];
  const ownerMap = new Map(owners.map((o) => [o.id, o.name ?? o.email]));

  const rows = vehicles.map((v) => ({
    ...v,
    ownerName: ownerMap.get(v.ownerId) ?? v.ownerId,
  }));

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description="Approve, deactivate, and register vehicles on behalf of employees."
        icon={Car}
      />
      <VehicleAdminTable rows={rows} />
    </div>
  );
}
