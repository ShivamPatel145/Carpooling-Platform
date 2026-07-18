/**
 * ONE Zod schema per entity, re-exported from the Drizzle table (generic-crud rule #2). BOTH the
 * API route and the form import from HERE. The schema lives in db/schema/vehicle.ts so table,
 * validation, and types never drift.
 */
export {
  vehicleFormSchema,
  vehicleSelectSchema,
  vehicleApprovalStatusEnum,
  type Vehicle,
  type VehicleFormValues,
  type VehicleApprovalStatus,
} from "@/db/schema/vehicle";

import { vehicleApprovalStatusEnum } from "@/db/schema/vehicle";
import { humanize } from "@/lib/utils";

/** Options for the status select + faceted filter (single source for both). */
export const vehicleApprovalOptions = vehicleApprovalStatusEnum.enumValues.map((value) => ({
  value,
  label: humanize(value),
}));
