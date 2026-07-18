import { requireRolePage } from "@/lib/session";

/**
 * Admin route group — gated to company_admin-or-above at the LAYOUT (server-side). Every /admin/*
 * page inherits the gate; a lower role is redirected. The individual API routes re-enforce their
 * own requirePermission — this layout gate is convenience, not the authorization boundary.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRolePage("company_admin");
  return <>{children}</>;
}
