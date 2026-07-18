import type { Metadata } from "next";
import { count, eq } from "drizzle-orm";
import { Building2 } from "lucide-react";
import { requireSuperAdminPage } from "@/lib/session";
import { db } from "@/db";
import { organization, user } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
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
      <PageHeader
        title="Organizations"
        description="All registered tenants across the platform. Create orgs and invite their company admins here."
        icon={Building2}
      />
      <OrgTable initialRows={rows} />
    </div>
  );
}
