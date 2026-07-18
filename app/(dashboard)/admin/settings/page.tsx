import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireRolePage } from "@/lib/session";
import { db } from "@/db";
import { organization } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { OrgSettingsForm } from "@/features/organization/org-settings-form";

export const metadata: Metadata = { title: "Settings" };

/**
 * /admin/settings — Company Details + Carpooling Configuration.
 * The company_admin edits their own org's config (fuel cost, domains, etc.).
 * SEAM: Slice C reads fuelCostPerKm + travelCostPerKm for financial reports — admin owns the config.
 */
export default async function AdminSettingsPage() {
  const session = await requireRolePage("company_admin");
  const orgId = session.user.orgId;
  if (!orgId) notFound();

  const org = await db.query.organization.findFirst({
    where: eq(organization.id, orgId),
  });
  if (!org) notFound();

  return (
    <div>
      <PageHeader
        title="Organization Settings"
        description="Company details and carpooling configuration. Cost fields feed into Slice C's financial reports."
        icon={Settings}
      />
      <OrgSettingsForm org={org} />
    </div>
  );
}
