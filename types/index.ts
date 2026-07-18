/**
 * Shared cross-slice types. Entity-specific types live in features/<entity>/schema.ts (derived
 * from the Drizzle table). Put only genuinely shared shapes here.
 */

/** Standard success envelope for list endpoints that paginate server-side (build-day option). */
export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

/** A generic option for selects/filters. */
export interface Option {
  label: string;
  value: string;
}

/** Re-export the API error body + role types so slices import from one place. */
export type { ApiErrorBody } from "@/lib/api";
export type { Role, Resource } from "@/lib/permissions";
export type { UserRole } from "@/db/schema/user";
