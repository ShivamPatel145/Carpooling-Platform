/**
 * features/vehicle — an employee's registered cars (Slice A). orgId-scoped queries (scopedWhere),
 * ownership-scoped edit/delete, admin approval gate.
 *
 *   schema.ts   → the ONE Zod schema (re-exported from db/schema/vehicle), shared with the API
 *   hooks.ts    → TanStack Query hooks + mutations (invalidate on success, toast)
 *   columns.tsx → DataTable column defs
 *   form.tsx    → RHF + zodResolver on the shared schema
 *   components/ → list, create dialog, row actions
 */
export { VehicleList } from "./components/vehicle-list";
export { CreateVehicleDialog } from "./components/create-dialog";
export { VehicleForm } from "./form";
export { vehicleColumns } from "./columns";
export * from "./hooks";
export * from "./schema";
