"use client";

import * as React from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Check,
  CheckCheck,
  Info,
  CircleCheck,
  TriangleAlert,
  CircleAlert,
  Loader2,
} from "lucide-react";
import { coCard, coGhostBtn } from "@/components/co/ui";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { markNotificationRead, markAllNotificationsRead } from "@/app/(dashboard)/notifications/actions";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface NotificationRow {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  href: string | null;
  createdAt: string;
  isRead: boolean;
}

/** Type → icon + tile colours. Warning reuses the amber accent (design-standards: no extra hues). */
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
 * Notifications feed (Coride). Renders the user's notification list as icon-tile rows — the tile
 * colour reflects the type, an amber dot marks unread. Reading is optimistic: we flip local state,
 * fire the server action, and invalidate the header bell's unread query. Data is owner-scoped by
 * the page + the action; nothing here fabricates a row.
 */
export function NotificationsList({ initial }: { initial: NotificationRow[] }) {
  const [items, setItems] = React.useState(initial);
  const [busyAll, setBusyAll] = React.useState(false);
  const qc = useQueryClient();

  React.useEffect(() => setItems(initial), [initial]);

  const unread = items.filter((n) => !n.isRead).length;

  function refreshBell() {
    qc.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
  }

  async function readOne(id: string) {
    const target = items.find((n) => n.id === id);
    if (!target || target.isRead) return;
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await markNotificationRead(id);
      refreshBell();
    } catch {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)));
      toast({ variant: "destructive", title: "Couldn't mark as read", description: "Please try again." });
    }
  }

  async function readAll() {
    if (unread === 0) return;
    setBusyAll(true);
    const snapshot = items;
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await markAllNotificationsRead();
      refreshBell();
      toast({ variant: "success", title: "All caught up", description: "Every notification is marked read." });
    } catch {
      setItems(snapshot);
      toast({ variant: "destructive", title: "Couldn't update", description: "Please try again." });
    } finally {
      setBusyAll(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className={`${coCard} flex flex-col items-center justify-center px-6 py-16 text-center`}>
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-[12px] bg-[color:var(--surface-2)] text-[color:var(--ink-3)]">
          <Bell className="h-5 w-5" />
        </span>
        <div className="font-display text-[16px] font-semibold text-[color:var(--ink)]">
          You&apos;re all caught up
        </div>
        <p className="m-0 mt-1 max-w-[320px] text-[14px] text-[color:var(--ink-3)]">
          Match, ETA and payment alerts will land here as they happen.
        </p>
      </div>
    );
  }

  return (
    <div>
      {unread > 0 && (
        <div className="mb-3 flex items-center justify-between">
          <div className="font-mono text-[12.5px] text-[color:var(--ink-3)]">
            {unread} unread
          </div>
          <button
            type="button"
            onClick={readAll}
            disabled={busyAll}
            className={cn(coGhostBtn, "px-3.5 py-2 text-[13px]")}
          >
            {busyAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
            Mark all read
          </button>
        </div>
      )}

      <ul className={`${coCard} flex flex-col px-4`}>
        {items.map((n, i) => {
          const style = TYPE_STYLE[n.type] ?? TYPE_STYLE.info;
          const Icon = style.icon;
          const Body = (
            <>
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]",
                  style.tile,
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "truncate text-[14px]",
                      n.isRead
                        ? "font-medium text-[color:var(--ink-2)]"
                        : "font-semibold text-[color:var(--ink)]",
                    )}
                  >
                    {n.title}
                  </span>
                  {!n.isRead && (
                    <span
                      aria-label="Unread"
                      className="h-2 w-2 shrink-0 rounded-full bg-[color:var(--amber-strong)]"
                    />
                  )}
                </div>
                {n.body && (
                  <div className="mt-0.5 truncate text-[13px] text-[color:var(--ink-3)]">{n.body}</div>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span className="whitespace-nowrap font-mono text-[11.5px] text-[color:var(--ink-3)]">
                  {formatWhen(n.createdAt)}
                </span>
                {!n.isRead && (
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[color:var(--amber-strong)]">
                    <Check className="h-3 w-3" />
                    Mark read
                  </span>
                )}
              </div>
            </>
          );

          const rowClass = cn(
            "flex w-full items-center gap-3.5 py-3.5 text-left transition-colors",
            i > 0 && "border-t border-[color:var(--line)]",
            !n.isRead && "cursor-pointer hover:opacity-80",
          );

          return (
            <li key={n.id}>
              {n.href ? (
                <Link href={n.href} className={rowClass} onClick={() => readOne(n.id)}>
                  {Body}
                </Link>
              ) : (
                <button type="button" className={rowClass} onClick={() => readOne(n.id)} disabled={n.isRead}>
                  {Body}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
