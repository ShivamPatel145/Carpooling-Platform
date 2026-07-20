"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Car, Check, X, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/states";
import { coCard, coAmberBtn, coGhostBtn, CoAvatar, coInitials, CoEyebrow } from "@/components/co/ui";

export interface VehicleAdminRow {
  id: string;
  model: string;
  registrationNo: string;
  seatingCapacity: number;
  approvalStatus: "approved" | "inactive" | "rejected";
  ownerId: string;
  ownerName: string;
  createdAt: Date;
}

/** Shared mutation — flips a vehicle's approval status, then refreshes the server data. */
function useSetStatus() {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function setStatus(id: string, status: "approved" | "inactive" | "rejected") {
    setPendingId(id);
    try {
      await fetch(`/api/vehicle/admin/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalStatus: status }),
      });
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  return { setStatus, pendingId };
}

/**
 * Vehicle oversight for company_admin, restyled to the Coride vocabulary. A "Pending approvals"
 * lane sits above the full roster so the admin's one real job — vetting new cars — is front and
 * centre. Both surfaces drive the same PATCH /api/vehicle/admin/[id] mutation; data is org-scoped
 * server-side.
 */
export function VehicleAdminTable({ rows }: { rows: VehicleAdminRow[] }) {
  const { setStatus, pendingId } = useSetStatus();
  const pending = rows.filter((v) => v.approvalStatus === "inactive");

  return (
    <div className="flex flex-col gap-6">
      {/* Pending approvals lane */}
      {pending.length > 0 && (
        <section>
          <CoEyebrow className="mb-3">
            Pending approvals · {pending.length}
          </CoEyebrow>
          <div className="flex flex-col gap-2.5">
            {pending.map((v) => {
              const busy = pendingId === v.id;
              return (
                <div
                  key={v.id}
                  className={`${coCard} flex flex-wrap items-center gap-3.5 p-3.5 sm:p-4`}
                >
                  <CoAvatar initials={coInitials(v.ownerName)} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-semibold text-[color:var(--ink)]">
                      {v.model}
                    </div>
                    <div className="truncate font-mono text-[12px] text-[color:var(--ink-3)]">
                      {v.registrationNo} · {v.ownerName}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setStatus(v.id, "rejected")}
                      id={`reject-vehicle-${v.id}`}
                      className={`${coGhostBtn} px-3.5 py-2 text-[13px] disabled:opacity-60`}
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setStatus(v.id, "approved")}
                      id={`approve-vehicle-${v.id}`}
                      className={`${coAmberBtn} px-3.5 py-2 text-[13px]`}
                    >
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Approve
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Full roster */}
      <section>
        <CoEyebrow className="mb-3">All vehicles · {rows.length}</CoEyebrow>
        <div className={`${coCard} overflow-hidden`}>
          {rows.length === 0 ? (
            <p className="px-5 py-12 text-center text-[13px] text-[color:var(--ink-3)]">
              No vehicles registered. Employees can register their vehicles from the app, or you can
              register on their behalf.
            </p>
          ) : (
            <>
              {/* header row (md+) */}
              <div className="hidden border-b border-[color:var(--line)] px-5 py-3 md:grid md:grid-cols-[1.4fr_1fr_auto_auto] md:items-center md:gap-4">
                <HeaderCell>Vehicle</HeaderCell>
                <HeaderCell>Owner</HeaderCell>
                <HeaderCell>Status</HeaderCell>
                <HeaderCell className="text-right">Action</HeaderCell>
              </div>
              <ul>
                {rows.map((v, i) => {
                  const busy = pendingId === v.id;
                  const isApproved = v.approvalStatus === "approved";
                  return (
                    <li
                      key={v.id}
                      className={`grid grid-cols-1 gap-2.5 px-5 py-4 md:grid-cols-[1.4fr_1fr_auto_auto] md:items-center md:gap-4 ${
                        i > 0 ? "border-t border-[color:var(--line)]" : ""
                      }`}
                    >
                      {/* Vehicle */}
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[color:var(--surface-2)] text-[color:var(--ink-2)]">
                          <Car className="h-[18px] w-[18px]" strokeWidth={1.6} />
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-[14px] font-semibold text-[color:var(--ink)]">
                            {v.model}
                          </div>
                          <div className="truncate font-mono text-[12px] text-[color:var(--ink-3)]">
                            {v.registrationNo} · {v.seatingCapacity} seats
                          </div>
                        </div>
                      </div>

                      {/* Owner */}
                      <div className="text-[14px] text-[color:var(--ink-2)]">
                        <span className="text-[color:var(--ink-3)] md:hidden">Owner · </span>
                        {v.ownerName}
                      </div>

                      {/* Status */}
                      <div className="md:justify-self-start">
                        <StatusBadge status={v.approvalStatus} />
                      </div>

                      {/* Action */}
                      <div className="md:justify-self-end">
                        {isApproved ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setStatus(v.id, "inactive")}
                            id={`deactivate-vehicle-${v.id}`}
                            className={`${coGhostBtn} px-3.5 py-2 text-[13px] disabled:opacity-60`}
                          >
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                            Deactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setStatus(v.id, "approved")}
                            id={`approve-vehicle-${v.id}`}
                            className={`${coAmberBtn} px-3.5 py-2 text-[13px]`}
                          >
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            Approve
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function HeaderCell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-[color:var(--ink-3)] ${className}`}
    >
      {children}
    </div>
  );
}
