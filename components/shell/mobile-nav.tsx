"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavLinks } from "@/components/shell/nav-links";
import { CorideMark } from "@/components/shell/coride-logo";
import { SidebarUser } from "@/components/shell/sidebar-user";
import type { Role } from "@/lib/permissions";

/** Hamburger + slide-in drawer for < lg. Mirrors the desktop sidebar; closes on navigation. */
export function MobileNav({
  role,
  productName,
  orgName,
  user,
  department,
}: {
  role: Role;
  productName: string;
  orgName?: string | null;
  user: { name?: string | null; email?: string | null };
  department?: string | null;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Open menu"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--ink-2)] transition-colors hover:text-[color:var(--ink)] lg:hidden"
        >
          <Menu className="h-[18px] w-[18px]" strokeWidth={1.6} />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex w-[272px] flex-col gap-0 border-[color:var(--line)] bg-[color:var(--page)] p-0"
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex items-center gap-3 px-4 pb-4 pt-[18px]">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[color:var(--band)]">
            <CorideMark size={22} />
          </span>
          <div className="min-w-0">
            <div className="font-display text-[17px] font-bold leading-none tracking-[-0.02em] text-[color:var(--ink)]">
              {productName}
            </div>
            <div className="truncate font-mono text-[11.5px] text-[color:var(--ink-3)]">
              {orgName ?? "Carpooling"}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <NavLinks role={role} onNavigate={() => setOpen(false)} />
        </div>
        <div className="border-t border-[color:var(--line)] p-3">
          <SidebarUser user={user} department={department} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
