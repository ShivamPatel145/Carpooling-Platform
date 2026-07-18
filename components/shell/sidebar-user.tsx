import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/(auth)/actions";

function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "?";
  const parts = source.split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/**
 * Pinned sidebar footer — avatar + name + department, with a sign-out button. Matches the Coride
 * comp's user card (surface-2 pill, ink avatar tile).
 */
export function SidebarUser({
  user,
  department,
}: {
  user: { name?: string | null; email?: string | null };
  department?: string | null;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[11px] bg-[color:var(--surface-2)] px-2.5 py-2">
      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-[color:var(--avatar-bg)] font-display text-[13px] font-semibold text-[color:var(--avatar-fg)]">
        {initials(user.name, user.email)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-semibold text-[color:var(--ink)]">
          {user.name ?? "Account"}
        </div>
        <div className="truncate text-[11.5px] text-[color:var(--ink-3)]">
          {department ?? user.email}
        </div>
      </div>
      <form action={signOutAction}>
        <button
          type="submit"
          title="Sign out"
          aria-label="Sign out"
          className="flex shrink-0 items-center rounded-md p-1 text-[color:var(--ink-3)] transition-colors hover:text-[color:var(--ink)]"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.6} />
        </button>
      </form>
    </div>
  );
}
