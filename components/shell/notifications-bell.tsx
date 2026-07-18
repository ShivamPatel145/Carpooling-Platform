"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Info,
  CircleCheck,
  TriangleAlert,
  CircleAlert,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { markNotificationRead, markAllNotificationsRead } from "@/app/(dashboard)/notifications/actions";

type NotificationType = "info" | "success" | "warning" | "error";

interface BellNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  href: string | null;
  createdAt: string;
  isRead: boolean;
}

interface BellData {
  items: BellNotification[];
  unread: number;
}

const QUERY_KEY = ["notifications", "unread-count"] as const;

/** Type → icon + tile colour (mirrors the full notifications feed — warning reuses the amber accent). */
const TYPE_STYLE: Record<
  NotificationType,
  { icon: React.ComponentType<{ className?: string }>; tile: string }
> = {
  info: { icon: Info, tile: "bg-[color:var(--surface-2)] text-[color:var(--ink-2)]" },
  success: { icon: CircleCheck, tile: "bg-[color:var(--ok-tint)] text-[color:var(--ok)]" },
  warning: { icon: TriangleAlert, tile: "bg-[color:var(--amber-tint)] text-[color:var(--amber-strong)]" },
  error: { icon: CircleAlert, tile: "bg-[color:var(--destructive)]/10 text-[color:var(--destructive)]" },
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} · ${time}`;
}

/**
 * Topbar bell — the notifications surface for employees (who no longer have a sidebar page). Polls
 * the recent feed + unread count, shows them in a dropdown, and marks read optimistically via the
 * shared server actions. Company admins additionally get a "View all" link to the full-page feed.
 */
export function NotificationsBell({ showViewAll = false }: { showViewAll?: boolean }) {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [busyAll, setBusyAll] = React.useState(false);

  const { data } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => fetcher<BellData>("/api/notifications"),
    refetchInterval: 60_000,
    retry: false,
  });

  const items = data?.items ?? [];
  const unread = data?.unread ?? 0;

  function invalidate() {
    qc.invalidateQueries({ queryKey: QUERY_KEY });
  }

  async function readOne(id: string) {
    const target = items.find((n) => n.id === id);
    if (!target || target.isRead) return;
    // Optimistic: flip the row + decrement the badge, then reconcile with the server.
    qc.setQueryData<BellData>(QUERY_KEY, (old) =>
      old
        ? {
            items: old.items.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
            unread: Math.max(0, old.unread - 1),
          }
        : old,
    );
    try {
      await markNotificationRead(id);
    } finally {
      invalidate();
    }
  }

  async function readAll() {
    if (unread === 0) return;
    setBusyAll(true);
    qc.setQueryData<BellData>(QUERY_KEY, (old) =>
      old ? { items: old.items.map((n) => ({ ...n, isRead: true })), unread: 0 } : old,
    );
    try {
      await markAllNotificationsRead();
    } finally {
      setBusyAll(false);
      invalidate();
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--amber-strong)] px-1 text-[10px] font-semibold text-[color:var(--btn-amber-fg)]">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(380px,calc(100vw-24px))] rounded-2xl border-[color:var(--line)] bg-[color:var(--surface)] p-0 text-[color:var(--ink)] shadow-lg"
      >
        <div className="flex items-center justify-between gap-2 border-b border-[color:var(--line)] px-4 py-3">
          <div className="font-display text-[15px] font-semibold text-[color:var(--ink)]">Notifications</div>
          {unread > 0 && (
            <button
              type="button"
              onClick={readAll}
              disabled={busyAll}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-mono text-[11.5px] text-[color:var(--ink-3)] transition-colors hover:text-[color:var(--ink)] disabled:opacity-60"
            >
              {busyAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
              Mark all read
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-[12px] bg-[color:var(--surface-2)] text-[color:var(--ink-3)]">
              <Bell className="h-5 w-5" />
            </span>
            <div className="font-display text-[14.5px] font-semibold text-[color:var(--ink)]">
              You&apos;re all caught up
            </div>
            <p className="m-0 mt-1 max-w-[260px] text-[13px] text-[color:var(--ink-3)]">
              Match, ETA and payment alerts land here as they happen.
            </p>
          </div>
        ) : (
          <ul className="max-h-[min(60vh,420px)] overflow-y-auto">
            {items.map((n, i) => {
              const style = TYPE_STYLE[n.type] ?? TYPE_STYLE.info;
              const Icon = style.icon;
              const inner = (
                <>
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]", style.tile)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "truncate text-[13.5px]",
                          n.isRead ? "font-medium text-[color:var(--ink-2)]" : "font-semibold text-[color:var(--ink)]",
                        )}
                      >
                        {n.title}
                      </span>
                      {!n.isRead && (
                        <span aria-label="Unread" className="h-2 w-2 shrink-0 rounded-full bg-[color:var(--amber-strong)]" />
                      )}
                    </div>
                    {n.body && <div className="mt-0.5 truncate text-[12.5px] text-[color:var(--ink-3)]">{n.body}</div>}
                    <div className="mt-1 font-mono text-[11px] text-[color:var(--ink-3)]">{formatWhen(n.createdAt)}</div>
                  </div>
                </>
              );

              const rowClass = cn(
                "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                i > 0 && "border-t border-[color:var(--line)]",
                "hover:bg-[color:var(--surface-2)]",
              );

              return (
                <li key={n.id}>
                  {n.href ? (
                    <Link
                      href={n.href}
                      className={rowClass}
                      onClick={() => {
                        void readOne(n.id);
                        setOpen(false);
                      }}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <button type="button" className={rowClass} onClick={() => void readOne(n.id)}>
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {showViewAll && (
          <div className="border-t border-[color:var(--line)] p-2">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 font-mono text-[12.5px] font-semibold text-[color:var(--amber-strong)] transition-colors hover:bg-[color:var(--surface-2)]"
            >
              View all notifications
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
