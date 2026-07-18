import type { Metadata } from "next";
import { count, eq } from "drizzle-orm";
import { requireSuperAdminPage } from "@/lib/session";
import { db } from "@/db";
import { organization, user } from "@/db/schema";
import { OrgTable } from "./org-table";

export const metadata: Metadata = { title: "Organizations — Platform" };

/**
 * /platform/organizations — super-admin only (cross-tenant by design).
 * Lists ALL orgs with member counts; Create Org + Invite Admin dialogs inline.
 */
export default async function PlatformOrgsPage() {
  await requireSuperAdminPage();

  // Cross-tenant: no scopedWhere needed — this IS the audited super-admin path.
  const orgs = await db.select().from(organization).orderBy(organization.name);

  // Get user counts per org
  const userCounts = await db
    .select({ orgId: user.orgId, count: count() })
    .from(user)
    .groupBy(user.orgId);

  const orgCountMap = new Map(userCounts.map((r) => [r.orgId, r.count]));

  const rows = orgs.map((org) => ({
    ...org,
    userCount: orgCountMap.get(org.id) ?? 0,
  }));

  return (
    <div>
      <div className="mb-6">
        <h2 className="m-0 font-display text-[clamp(22px,3vw,28px)] font-bold tracking-[-0.02em] text-[color:var(--ink)]">
          Organizations
        </h2>
        <p className="m-0 mt-1 text-[15px] text-[color:var(--ink-2)]">
          Create tenants and appoint their company admins.
        </p>
      </div>
      <OrgTable initialRows={rows} />
    </div>
  );
}
