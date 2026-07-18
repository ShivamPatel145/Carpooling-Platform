import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/session";
import { db } from "@/db";
import { organization, user as userTable } from "@/db/schema";
import { DashboardShell } from "@/components/shell/dashboard-shell";

/**
 * Protected dashboard layout. Runs FULL session validation server-side (not the edge cookie
 * check) and renders the role-aware Coride shell. Every /(dashboard) route inherits the chrome.
 * We hydrate the sidebar with the user's org name + department (shown under the brand + on the
 * user card) — a small, cached-per-request pair of lookups.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const { id: userId, orgId } = session.user;

  const [org, me] = await Promise.all([
    orgId
      ? db
          .select({ name: organization.name })
          .from(organization)
          .where(eq(organization.id, orgId))
          .limit(1)
      : Promise.resolve([]),
    db
      .select({ department: userTable.department })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1),
  ]);

  return (
    <DashboardShell
      user={session.user}
      orgName={org[0]?.name ?? null}
      department={me[0]?.department ?? null}
    >
      {children}
    </DashboardShell>
  );
}
