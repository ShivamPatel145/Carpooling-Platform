import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Coride shared UI primitives — the visual vocabulary lifted from the design comp so every employee
 * screen (dashboard, find, offer, trips, tracking) reads as one system. Tokens come from globals.css
 * (`--surface`, `--ink`, `--line`, `--amber-strong`, `--avatar-bg`, …), swapping automatically in
 * dark mode. Keep these dumb + presentational; wiring lives in the screens/features.
 */

/** Surface card: white on cream (light) / raised charcoal (dark), warm hairline border. */
export const coCard =
  "rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]";

/** The primary CTA — amber-strong fill, brightens on hover, nudges on press. */
export const coAmberBtn =
  "inline-flex items-center justify-center gap-2 rounded-[10px] bg-[color:var(--btn-amber-bg)] font-semibold text-[color:var(--btn-amber-fg)] transition hover:brightness-[1.07] active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--amber)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface)] disabled:pointer-events-none disabled:opacity-60";

/** Secondary/ghost button — surface fill, line border. */
export const coGhostBtn =
  "inline-flex items-center justify-center gap-2 rounded-[10px] border border-[color:var(--line-2)] bg-[color:var(--surface)] font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--ink)] active:scale-[.98]";

/** Two-letter initials from a name (falls back to "Driver"). */
export function coInitials(name?: string | null) {
  const parts = (name?.trim() || "Driver").split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** Split a Date/ISO into a big HH:MM and an AM/PM + short-date caption for card time columns. */
export function splitDepartTime(v: Date | string) {
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return { time: "--:--", meta: "" };
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const day = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  return { time: `${String(h).padStart(2, "0")}:${m}`, meta: `${ampm} · ${day}` };
}

/** Initials avatar tile — ink block, display face. */
export function CoAvatar({
  initials,
  className,
  size = 38,
}: {
  initials: string;
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[10px] bg-[color:var(--avatar-bg)] font-display font-semibold text-[color:var(--avatar-fg)]",
        className,
      )}
      style={{ width: size, height: size, fontSize: size <= 34 ? 12 : 13 }}
    >
      {initials}
    </span>
  );
}

/** Amber-tint pill — seats-left / status chip. */
export function CoSeatBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full border border-[color:var(--amber-line)] bg-[color:var(--amber-tint)] px-[11px] py-1 font-mono text-[12.5px] font-semibold text-[color:var(--amber-strong)]">
      {children}
    </span>
  );
}

/**
 * The origin → destination line: a hollow ring, a dashed connector carrying the distance, and a
 * rotated ink diamond for the drop. Used in ride cards, trip cards and tracking.
 */
export function CoRouteLine({ middle }: { middle?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <span className="h-2 w-2 shrink-0 rounded-full border-2 border-[color:var(--ink-2)]" />
      <span
        className="h-0.5 flex-1"
        style={{
          background:
            "repeating-linear-gradient(90deg,var(--line-2) 0 6px,transparent 6px 11px)",
        }}
      />
      {middle && (
        <span className="whitespace-nowrap font-mono text-[12px] text-[color:var(--ink-3)]">
          {middle}
        </span>
      )}
      <span
        className="h-0.5 flex-1"
        style={{
          background:
            "repeating-linear-gradient(90deg,var(--line-2) 0 6px,transparent 6px 11px)",
        }}
      />
      <span className="h-[9px] w-[9px] shrink-0 rotate-45 bg-[color:var(--ink)]" />
    </div>
  );
}

/** Small uppercase eyebrow label used above sections/cards. */
export function CoEyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-[color:var(--ink-3)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
