import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/session";
import { db } from "@/db";
import { organization, user as userTable } from "@/db/schema";
import { coCard, CoAvatar, coInitials } from "@/components/co/ui";
import { PreferencesPanel } from "@/components/settings/preferences-panel";

export const metadata: Metadata = { title: "Settings" };

/**
 * Profile + Preferences (comp: identity card on the left, preference switches on the right).
 * Identity fields are the real user row; preferences are wired in the client panel.
 */
export default async function ProfilePage() {
  const { user } = await requireSession();

  const [me, orgRow] = await Promise.all([
    db
      .select({ department: userTable.department, office: userTable.officeLocation })
      .from(userTable)
      .where(eq(userTable.id, user.id))
      .limit(1),
    user.orgId
      ? db.select({ name: organization.name }).from(organization).where(eq(organization.id, user.orgId)).limit(1)
      : Promise.resolve([]),
  ]);

  const department = me[0]?.department ?? "—";
  const office = me[0]?.office ?? "—";
  const orgName = orgRow[0]?.name ?? "—";

  const facts: { label: string; value: string }[] = [
    { label: "Department", value: department },
    { label: "Office", value: office },
    { label: "Company", value: orgName },
  ];

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Identity */}
        <div className={`${coCard} p-6`}>
          <div className="flex items-center gap-4">
            <CoAvatar initials={coInitials(user.name)} size={52} />
            <div className="min-w-0">
              <div className="truncate font-display text-[19px] font-semibold text-[color:var(--ink)]">
                {user.name ?? "Employee"}
              </div>
              <div className="truncate font-mono text-[12.5px] text-[color:var(--ink-3)]">{user.email}</div>
            </div>
          </div>
          <dl className="mt-5 border-t border-[color:var(--line)] pt-1">
            {facts.map((f) => (
              <div key={f.label} className="flex items-center justify-between border-b border-[color:var(--line)] py-3 last:border-b-0">
                <dt className="text-[13px] text-[color:var(--ink-3)]">{f.label}</dt>
                <dd className="text-[14px] font-semibold text-[color:var(--ink)]">
                  {f.label === "Company" ? (
                    <span className="inline-flex items-center gap-1.5">
                      {f.value}
                      <span className="rounded-full bg-[color:var(--ok-tint)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--ok)]">
                        verified
                      </span>
                    </span>
                  ) : (
                    f.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Preferences */}
        <div className={`${coCard} p-6`}>
          <div className="mb-1 font-display text-[15px] font-semibold text-[color:var(--ink)]">Preferences</div>
          <PreferencesPanel />
        </div>
      </div>
    </div>
  );
}
