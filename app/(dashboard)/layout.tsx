import { requireSession } from "@/lib/session";
import { DashboardShell } from "@/components/shell/dashboard-shell";

/**
 * Protected dashboard layout. Runs FULL session validation server-side (not the edge cookie
 * check) and renders the role-aware shell. Every /(dashboard) route inherits the chrome.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return <DashboardShell user={session.user}>{children}</DashboardShell>;
}
