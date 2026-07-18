"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, LogIn, CheckCircle2, Activity as ActivityIcon, type LucideIcon } from "lucide-react";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import { coCard } from "@/components/co/ui";
import { api } from "@/lib/fetcher";
import { formatDateTime, humanize, shortId } from "@/lib/utils";

/**
 * Read-only audit trail viewer, restyled to Coride rows. Same generic data source (GET
 * /api/activity-log) — only presentation changed. Each row: an action-typed icon tile, the actor +
 * humanised action + resource, the resource id in mono, and the timestamp on the right.
 */
interface ActivityRow {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  ip: string | null;
  createdAt: string;
  actorName: string | null;
  actorEmail: string | null;
}

const PAGE_SIZE = 20;

/** Map an action verb to an icon so the log scans quickly. */
function iconFor(action: string): LucideIcon {
  const a = action.toLowerCase();
  if (a.includes("create")) return Plus;
  if (a.includes("update") || a.includes("edit")) return Pencil;
  if (a.includes("delete") || a.includes("remove")) return Trash2;
  if (a.includes("login") || a.includes("sign")) return LogIn;
  if (a.includes("approve") || a.includes("complete")) return CheckCircle2;
  return ActivityIcon;
}

export function ActivityView() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["activity-log", "list"],
    queryFn: () => api.get<ActivityRow[]>("/api/activity-log"),
  });

  const [visible, setVisible] = React.useState(PAGE_SIZE);

  if (isLoading) return <TableSkeleton rows={6} cols={1} />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={ActivityIcon}
        title="No activity yet"
        description="Actions across the app are recorded here as they happen."
      />
    );
  }

  const rows = data.slice(0, visible);
  const hasMore = visible < data.length;

  return (
    <div className={`${coCard} overflow-hidden`}>
      <ul>
        {rows.map((r, i) => {
          const Icon = iconFor(r.action);
          return (
            <li
              key={r.id}
              className={`flex items-start gap-3.5 px-5 py-3.5 ${
                i > 0 ? "border-t border-[color:var(--line)]" : ""
              }`}
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[color:var(--surface-2)] text-[color:var(--ink-2)]">
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="text-[14px] text-[color:var(--ink)]">
                  <span className="font-semibold">{r.actorName ?? "System"}</span>
                  <span className="text-[color:var(--ink-2)]">
                    {" "}
                    {humanize(r.action).toLowerCase()} · {humanize(r.resource)}
                  </span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 font-mono text-[12px] text-[color:var(--ink-3)]">
                  {r.actorEmail && <span className="truncate">{r.actorEmail}</span>}
                  {r.resourceId && (
                    <>
                      {r.actorEmail && <span aria-hidden>·</span>}
                      <span>#{shortId(r.resourceId)}</span>
                    </>
                  )}
                  {r.ip && (
                    <>
                      <span aria-hidden>·</span>
                      <span>{r.ip}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="shrink-0 whitespace-nowrap pl-2 font-mono text-[12px] text-[color:var(--ink-3)]">
                {formatDateTime(r.createdAt)}
              </div>
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <div className="border-t border-[color:var(--line)] px-5 py-3.5 text-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="text-[13px] font-semibold text-[color:var(--amber-strong)] transition hover:brightness-110"
          >
            Show more · {data.length - visible} remaining
          </button>
        </div>
      )}
    </div>
  );
}
