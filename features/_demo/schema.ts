/**
 * ONE Zod schema per entity, re-exported from the Drizzle table (generic-crud rule #2). BOTH the
 * API route and the form import from HERE — never two copies. The schema itself lives in
 * db/schema/demo-entity.ts (derived from the table) so table, validation, and types never drift.
 *
 * When you copy this feature for a real entity, this file just re-points to your table's schema.
 */
export {
  demoEntityFormSchema,
  demoEntitySelectSchema,
  demoStatusEnum,
  type DemoEntity,
  type DemoEntityFormValues,
  type DemoStatus,
} from "@/db/schema/demo-entity";

import { demoStatusEnum } from "@/db/schema/demo-entity";
import { humanize } from "@/lib/utils";

/** Options for the status select + faceted filter (single source for both). */
export const demoStatusOptions = demoStatusEnum.enumValues.map((value) => ({
  value,
  label: humanize(value),
}));
