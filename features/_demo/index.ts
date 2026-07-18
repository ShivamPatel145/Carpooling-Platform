/**
 * features/_demo — the COMPLETE, working CRUD reference. Tomorrow every slice copies this folder,
 * renames it to a real domain entity, and adapts the fields. Don't start from a blank file.
 *
 *   schema.ts   → the ONE Zod schema (re-exported from the db table), shared with the API
 *   hooks.ts    → TanStack Query hooks + mutations (invalidate on success, toast)
 *   columns.tsx → DataTable column defs
 *   form.tsx    → RHF + zodResolver on the shared schema (every field primitive)
 *   components/ → list, create dialog, row actions
 */
export { DemoList } from "./components/demo-list";
export { CreateDemoEntityDialog } from "./components/create-dialog";
export { DemoEntityForm } from "./form";
export { demoColumns } from "./columns";
export * from "./hooks";
export * from "./schema";
