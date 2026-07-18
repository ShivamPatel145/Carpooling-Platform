"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { fetcher } from "@/lib/fetcher";

/**
 * Header bell with an unread-count badge. Polls the notifications stats endpoint; degrades to a
 * plain bell if the endpoint isn't available yet. Clicking goes to the notifications page.
 */
export function NotificationsBell() {
  const { data } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => fetcher<{ unread: number }>("/api/notifications/stats"),
    refetchInterval: 60_000,
    retry: false,
  });

  const unread = data?.unread ?? 0;

  return (
    <Button variant="ghost" size="icon" asChild aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
      <Link href="/notifications" className="relative">
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
    </Button>
  );
}
