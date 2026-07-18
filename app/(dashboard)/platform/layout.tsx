import { requireSuperAdminPage } from "@/lib/session";

/**
 * Platform console route group — SUPER ADMIN only (the one cross-tenant surface). Gated at the
 * layout; everyone else is redirected to their own console home. The individual API routes use
 * requireSuperAdmin() to re-enforce the exception in code review. See docs/PRD.md §7.13.
 *
 * Slice D (Mitesh) builds the screens here build-day: Organizations, Create Org / Invite Admin,
 * cross-org platform metrics.
 */
export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  await requireSuperAdminPage();
  return <>{children}</>;
}
