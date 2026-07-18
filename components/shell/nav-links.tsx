"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navForRole, navGroupsForRole } from "@/nav.config";
import type { Role } from "@/lib/permissions";
import { cn } from "@/lib/utils";

/**
 * Role-filtered nav, grouped, with active-route highlighting. Shared by the desktop sidebar and
 * the mobile sheet so they never drift. Driven entirely by nav.config.ts.
 */
export function NavLinks({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = navForRole(role);
  const groups = navGroupsForRole(role);

  return (
    <nav className="flex flex-col gap-4" aria-label="Primary">
      {groups.map((group) => (
        <div key={group || "ungrouped"} className="flex flex-col gap-1">
          {group && (
            <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {group}
            </p>
          )}
          {items
            .filter((i) => (i.group ?? "") === group)
            .map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
        </div>
      ))}
    </nav>
  );
}
