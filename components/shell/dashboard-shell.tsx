import { homepageCopy } from "@/homepage.config";
import { NavLinks } from "@/components/shell/nav-links";
import { MobileNav } from "@/components/shell/mobile-nav";
import { CorideMark } from "@/components/shell/coride-logo";
import { SidebarUser } from "@/components/shell/sidebar-user";
import { TopbarTitle } from "@/components/shell/topbar-title";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsBell } from "@/components/shell/notifications-bell";
import type { Role } from "@/lib/permissions";

/**
 * The dashboard chrome — Coride treatment. A fixed sidebar (lg+) with brand + org, an active-bar
 * nav, and a pinned user card; a sticky topbar carrying the per-screen title and theme toggle; and
 * an independently scrolling content column. Role-aware nav comes entirely from nav.config.ts.
 *
 * Server component — pass it the validated session user (full role validation, not the edge cookie
 * check). `orgName`/`department` are fetched by the layout and shown in the sidebar + user card.
 */
export function DashboardShell({
  user,
  orgName,
  department,
  children,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null; role: Role };
  orgName?: string | null;
  department?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[color:var(--page)] text-[color:var(--ink)]">
      {/* Desktop sidebar */}
      <aside className="hidden w-[264px] shrink-0 flex-col border-r border-[color:var(--line)] bg-[color:var(--page)] lg:flex">
        <div className="flex items-center gap-3 px-4 pb-4 pt-[18px]">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[color:var(--band)]">
            <CorideMark size={22} />
          </span>
          <div className="min-w-0">
            <div className="font-display text-[17px] font-bold leading-none tracking-[-0.02em] text-[color:var(--ink)]">
              {homepageCopy.productName}
            </div>
            <div className="truncate font-mono text-[11.5px] text-[color:var(--ink-3)]">
              {orgName ?? "Carpooling"}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <NavLinks role={user.role} />
        </div>
        <div className="border-t border-[color:var(--line)] p-3">
          <SidebarUser user={user} department={department} />
        </div>
      </aside>

      {/* Main column — scrolls independently of the sidebar */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[color:var(--line)] bg-[color:var(--page)] px-4 py-[14px] sm:px-6 lg:px-8">
          <MobileNav
            role={user.role}
            productName={homepageCopy.productName}
            orgName={orgName}
            user={user}
            department={department}
          />
          <TopbarTitle />
          <NotificationsBell />
          <ThemeToggle />
        </header>

        <main className="w-full max-w-[1120px] flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
