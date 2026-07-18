import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { requireRolePage } from "@/lib/session";
import { scopedWhere } from "@/lib/permissions";
import { db } from "@/db";
import { user } from "@/db/schema";
import { coCard, coGhostBtn, CoAvatar, coInitials } from "@/components/co/ui";
import { StatusBadge } from "@/components/states";

export const metadata: Metadata = { title: "Employee Details" };

/**
 * /admin/users/[id] — Employee Details (Coride design).
 * scopedWhere ensures the admin can ONLY view employees in their own org.
 * Cross-org request → notFound() (404, not 403) — the headline isolation test.
 */
export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireRolePage("company_admin");
  const tenant = {
    userId: session.user.id,
    orgId: session.user.orgId ?? null,
    role: session.user.role as "company_admin",
  };

  const emp = await db.query.user.findFirst({
    where: scopedWhere(tenant, user, eq(user.id, id)),
  });

  if (!emp) notFound(); // Cross-org: 404 not 403

  const roleLabel = emp.role === "company_admin" ? "Company Admin" : "Employee";

  const facts: { label: string; value: string; mono?: boolean }[] = [
    { label: "Department", value: emp.department ?? "—" },
    { label: "Office", value: emp.officeLocation ?? "—" },
    { label: "Manager", value: emp.manager ?? "—" },
    { label: "Phone", value: emp.phone ?? "—", mono: true },
    { label: "Role", value: roleLabel },
    { label: "Joined", value: emp.createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) },
  ];

  return (
    <div>
      <div className="mb-4">
        <Link href="/admin/users" className={`${coGhostBtn} h-9 px-3 text-[13px]`}>
          <ArrowLeft className="h-4 w-4" />
          Back to employees
        </Link>
      </div>

      {/* Coride page header */}
      <div className="mb-6">
        <h2 className="m-0 font-display text-[clamp(22px,3vw,28px)] font-bold tracking-[-0.02em] text-[color:var(--ink)]">
          {emp.name ?? emp.email}
        </h2>
        <p className="m-0 mt-1 text-[15px] text-[color:var(--ink-2)]">
          {roleLabel} · {emp.department ?? "No department"}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Identity + facts */}
        <div className={`${coCard} p-6`}>
          <div className="flex items-center gap-4">
            <CoAvatar initials={coInitials(emp.name ?? emp.email)} size={52} />
            <div className="min-w-0">
              <div className="truncate font-display text-[19px] font-semibold text-[color:var(--ink)]">
                {emp.name ?? "Employee"}
              </div>
              <div className="truncate font-mono text-[12.5px] text-[color:var(--ink-3)]">{emp.email}</div>
            </div>
          </div>
          <dl className="mt-5 border-t border-[color:var(--line)] pt-1">
            {facts.map((f) => (
              <div
                key={f.label}
                className="flex items-center justify-between gap-4 border-b border-[color:var(--line)] py-3 last:border-b-0"
              >
                <dt className="text-[13px] text-[color:var(--ink-3)]">{f.label}</dt>
                <dd className={`text-[14px] font-semibold text-[color:var(--ink)] ${f.mono ? "font-mono" : ""}`}>
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Status & access */}
        <div className={`${coCard} p-6`}>
          <div className="mb-1 font-display text-[15px] font-semibold text-[color:var(--ink)]">
            Status &amp; access
          </div>
          <p className="m-0 mb-4 text-[13px] text-[color:var(--ink-3)]">
            Membership and platform access for this employee.
          </p>
          <dl className="border-t border-[color:var(--line)] pt-1">
            <div className="flex items-center justify-between gap-4 border-b border-[color:var(--line)] py-3.5">
              <dt className="text-[13px] text-[color:var(--ink-3)]">Membership status</dt>
              <dd>
                <StatusBadge status={emp.status} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3.5">
              <dt className="text-[13px] text-[color:var(--ink-3)]">Platform access</dt>
              <dd>
                {emp.platformAccess === "revoked" ? (
                  <span className="inline-flex items-center rounded-full bg-[color:var(--destructive)]/10 px-2.5 py-0.5 text-[12px] font-semibold text-[color:var(--destructive)]">
                    Revoked
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-[color:var(--ok-tint)] px-2.5 py-0.5 text-[12px] font-semibold text-[color:var(--ok)]">
                    Active
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
