"use client";

import * as React from "react";
import { LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

/** A Coride pill switch — ink track, amber when on. */
function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-[26px] w-[46px] shrink-0 rounded-full border transition-colors",
        checked
          ? "border-[color:var(--amber-line)] bg-[color:var(--btn-amber-bg)]"
          : "border-[color:var(--line-2)] bg-[color:var(--surface-2)]",
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-white shadow-sm transition-all",
          checked ? "left-[24px]" : "left-[3px]",
        )}
      />
    </button>
  );
}

function Row({
  title,
  desc,
  children,
  first,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
  first?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 py-4",
        !first && "border-t border-[color:var(--line)]",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold text-[color:var(--ink)]">{title}</div>
        <div className="text-[12.5px] text-[color:var(--ink-3)]">{desc}</div>
      </div>
      {children}
    </div>
  );
}

/** Local-preference hook — persists a boolean flag per device (women-only / notifications). */
function useLocalFlag(key: string, initial: boolean): [boolean, (v: boolean) => void] {
  const [value, setValue] = React.useState(initial);
  React.useEffect(() => {
    const stored = window.localStorage.getItem(key);
    if (stored != null) setValue(stored === "1");
  }, [key]);
  const set = React.useCallback(
    (v: boolean) => {
      setValue(v);
      window.localStorage.setItem(key, v ? "1" : "0");
    },
    [key],
  );
  return [value, set];
}

/**
 * Preferences (comp: Dark mode / Women-only rides / Trip notifications + Sign out). Dark mode is the
 * real next-themes theme; the other two persist per-device in localStorage. Sign-out ends the session.
 */
export function PreferencesPanel() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const isDark = mounted && (theme === "dark" || resolvedTheme === "dark");

  const [womenOnly, setWomenOnly] = useLocalFlag("pref:womenOnly", false);
  const [notifications, setNotifications] = useLocalFlag("pref:tripNotifications", true);

  return (
    <div>
      <Row title="Dark mode" desc="Dusk Route, after hours" first>
        <Switch checked={isDark} onChange={(v) => setTheme(v ? "dark" : "light")} label="Dark mode" />
      </Row>
      <Row title="Women-only rides" desc="Only match with women drivers & riders">
        <Switch checked={womenOnly} onChange={setWomenOnly} label="Women-only rides" />
      </Row>
      <Row title="Trip notifications" desc="Match, ETA and payment alerts">
        <Switch checked={notifications} onChange={setNotifications} label="Trip notifications" />
      </Row>
      <div className="border-t border-[color:var(--line)] pt-4">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="inline-flex items-center gap-2 rounded-[10px] border border-[color:var(--line-2)] bg-[color:var(--surface)] px-4 py-2.5 text-[13px] font-semibold text-[color:var(--destructive)] transition hover:border-[color:var(--destructive)]"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
