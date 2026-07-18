import { Brand } from "@/components/shell/brand";
import { NavLinks } from "@/components/shell/nav-links";
import { MobileNav } from "@/components/shell/mobile-nav";
import { UserMenu } from "@/components/shell/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsBell } from "@/components/shell/notifications-bell";
import type { Role } from "@/lib/permissions";

/**
 * The dashboard chrome: fixed sidebar (lg+), sticky top bar, scrollable content. Role-aware nav
 * comes entirely from nav.config.ts. This is a server component — pass it the validated session
 * user from a server component / layout (full role validation, not the edge cookie check).
 *
 * SCOPE NOTE (TODAY.md): this shell is a considered bet placed before the wireframe. Sidebar +
 * top nav is near-universal for this class of tool. If the wireframe contradicts it tomorrow, the
 * chrome adapts and every primitive survives — because nothing was built past the shell.
 */
export function DashboardShell({
  user,
  children,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null; role: Role };
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card lg:flex lg:flex-col">
        <div className="flex h-14 items-center border-b px-6">
          <Brand href="/dashboard" />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <NavLinks role={user.role} />
        </div>
      </aside>

      {/* Main column */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
          <div className="flex items-center gap-2">
            <MobileNav role={user.role} />
            <span className="lg:hidden">
              <Brand href="/dashboard" />
            </span>
          </div>
          <div className="flex items-center gap-1">
            <NotificationsBell />
            <ThemeToggle />
            <UserMenu user={user} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
