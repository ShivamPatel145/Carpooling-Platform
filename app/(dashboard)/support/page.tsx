import type { Metadata } from "next";
import { LifeBuoy } from "lucide-react";
import { and, desc, eq } from "drizzle-orm";
import { requirePermissionPage } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/db";
import { supportTicket } from "@/db/schema";
import { StatusBadge } from "@/components/states";
import { coCard } from "@/components/co/ui";
import { CreateTicketDialog } from "@/features/support/components/create-ticket-dialog";

export const metadata: Metadata = { title: "Support" };

/** Priority chip — urgent/high carry the amber accent; low/medium stay quiet on surface-2. */
function PriorityChip({ priority }: { priority: string }) {
  const loud = priority === "urgent" || priority === "high";
  return (
    <span
      className={
        loud
          ? "inline-flex items-center rounded-full border border-[color:var(--amber-line)] bg-[color:var(--amber-tint)] px-2.5 py-0.5 font-mono text-[11.5px] font-semibold uppercase tracking-[0.04em] text-[color:var(--amber-strong)]"
          : "inline-flex items-center rounded-full border border-[color:var(--line-2)] bg-[color:var(--surface-2)] px-2.5 py-0.5 font-mono text-[11.5px] font-semibold uppercase tracking-[0.04em] text-[color:var(--ink-3)]"
      }
    >
      {priority}
    </span>
  );
}

/**
 * Support screen. Shared by employees (own tickets) and company admins (all org tickets). Employees
 * can raise a ticket (statement: supportTicket.create is employee-only); admins triage. Tickets are
 * org-scoped, and employees only ever see their own rows — nothing here is fabricated.
 */
export default async function SupportPage() {
  const session = await requirePermissionPage("supportTicket", "read");
  const { id: userId, orgId, role } = session.user;
  const canCreate = hasPermission(role, "supportTicket", "create");
  const isEmployee = role === "employee";

  // Employees: own tickets. Company admins: every ticket in their org.
  const scope = isEmployee
    ? and(eq(supportTicket.orgId, orgId!), eq(supportTicket.requesterId, userId))
    : eq(supportTicket.orgId, orgId!);

  const tickets = await db
    .select()
    .from(supportTicket)
    .where(scope)
    .orderBy(desc(supportTicket.createdAt))
    .limit(100);

  return (
    <div>
      {canCreate && (
        <div className="mb-6 flex justify-end">
          <CreateTicketDialog />
        </div>
      )}

      {tickets.length === 0 ? (
        <div className={`${coCard} flex flex-col items-center justify-center px-6 py-16 text-center`}>
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-[12px] bg-[color:var(--surface-2)] text-[color:var(--ink-3)]">
            <LifeBuoy className="h-5 w-5" />
          </span>
          <div className="font-display text-[16px] font-semibold text-[color:var(--ink)]">
            No tickets yet
          </div>
          <p className="m-0 mt-1 max-w-[340px] text-[14px] text-[color:var(--ink-3)]">
            {canCreate
              ? "Hit a snag on a ride? Raise a ticket and we'll pick it up."
              : "Tickets raised across your organization will show up here."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {tickets.map((t) => {
            const created = new Date(t.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
            return (
              <li key={t.id} className={`${coCard} p-[18px]`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-semibold text-[color:var(--ink)]">
                      {t.subject}
                    </div>
                    <p className="m-0 mt-1 line-clamp-2 text-[13.5px] text-[color:var(--ink-3)]">
                      {t.description}
                    </p>
                  </div>
                  <StatusBadge status={t.status} className="shrink-0" />
                </div>
                <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
                  <PriorityChip priority={t.priority} />
                  <span className="font-mono text-[11.5px] text-[color:var(--ink-3)]">#{t.id.slice(0, 8)}</span>
                  <div className="flex-1" />
                  <span className="font-mono text-[11.5px] text-[color:var(--ink-3)]">Raised {created}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
