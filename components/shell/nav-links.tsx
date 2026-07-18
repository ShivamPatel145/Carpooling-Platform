"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navForRole, navGroupsForRole } from "@/nav.config";
import type { Role } from "@/lib/permissions";
import { cn } from "@/lib/utils";

/**
 * Role-filtered nav, grouped, with active-route highlighting. Shared by the desktop sidebar and
 * the mobile drawer so they never drift. Driven entirely by nav.config.ts.
 *
 * Coride treatment: each item is a pill; the active item fills with surface-2, shows ink text, and
 * carries an amber left bar. Inactive items are ink-2 and warm on hover.
 */
export function NavLinks({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = navForRole(role);
  const groups = navGroupsForRole(role);

  // Longest matching href wins, so "/app" (Dashboard) doesn't stay lit on "/app/find" etc.
  const activeHref = items
    .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav className="flex flex-col gap-4" aria-label="Primary">
      {groups.map((group) => (
        <div key={group || "ungrouped"} className="flex flex-col gap-0.5">
          {group && (
            <p className="px-3 pb-1 pt-1 text-[11px] font-medium uppercase tracking-wider text-[color:var(--ink-3)]">
              {group}
            </p>
          )}
          {items
            .filter((i) => (i.group ?? "") === group)
            .map((item) => {
              const active = item.href === activeHref;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-[10px] py-2.5 pl-3 pr-3 text-[14px] font-medium transition-colors",
                    active
                      ? "bg-[color:var(--surface-2)] text-[color:var(--ink)]"
                      : "text-[color:var(--ink-2)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--ink)]",
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0 top-1/2 h-[18px] w-[3px] -translate-y-1/2 rounded-r-full bg-[color:var(--amber)] transition-opacity",
                      active ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.6} />
                  <span className="truncate">{item.title}</span>
                </Link>
              );
            })}
        </div>
      ))}
    </nav>
  );
}
