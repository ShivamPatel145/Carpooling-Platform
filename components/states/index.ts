/**
 * The five data-state primitives — mandated on EVERY screen (design-standards §7, generic-crud #4,
 * qa-verify). Import from here.
 *
 *   loading  → Spinner / TableSkeleton / CardGridSkeleton / FormSkeleton
 *   empty    → EmptyState
 *   error    → ErrorState
 *   success  → toast() from @/hooks/use-toast (+ <Toaster/> mounted in Providers)
 *   status   → StatusBadge
 */
export { EmptyState } from "./empty-state";
export { ErrorState } from "./error-state";
export { Spinner, TableSkeleton, CardGridSkeleton, FormSkeleton } from "./loading-state";
export { StatusBadge } from "./status-badge";
