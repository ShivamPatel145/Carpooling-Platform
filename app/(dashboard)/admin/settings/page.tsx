import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireRolePage } from "@/lib/session";
import { db } from "@/db";
import { organization } from "@/db/schema";
import { OrgSettingsForm } from "@/features/organization";

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
      <div className="mb-6">
        <h2 className="m-0 font-display text-[clamp(22px,3vw,28px)] font-bold tracking-[-0.02em] text-[color:var(--ink)]">
          Company Settings
        </h2>
        <p className="m-0 mt-1 text-[15px] text-[color:var(--ink-2)]">
          Domains, costs, and how carpooling works for your org.
        </p>
      </div>
      <OrgSettingsForm org={org} />
    </div>
  );
}
