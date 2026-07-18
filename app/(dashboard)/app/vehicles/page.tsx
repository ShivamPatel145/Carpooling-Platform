import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/session";
import { VehicleList } from "@/features/vehicle/components/vehicle-list";
import { CreateVehicleDialog } from "@/features/vehicle/components/create-dialog";

export const metadata: Metadata = { title: "My Vehicles" };

/**
 * The employee's vehicles screen. Gates read at the page; the API re-checks the permission and
 * enforces ownership + org scoping. Only APPROVED vehicles can back a ride (enforced in Offer).
 */
export default async function VehiclesPage() {
  await requirePermissionPage("vehicle", "read");

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-[14px] text-[color:var(--ink-2)]">
          Register the cars you drive. An admin approves each one before you can offer rides with it.
        </p>
        <CreateVehicleDialog />
      </div>
      <VehicleList />
    </div>
  );
}
