/**
 * DESIGN TOKENS — the single source of truth for this project's visual system.
 *
 * This file is synced and published to Claude Design. It is the enforced companion to
 * `docs/design-standards.md`. Read that file before touching UI.
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────┐
 * │  LOCKED (Phase 0): type system · spacing scale · radii · motion · neutral base.        │
 * │  Changing any of these desynchronises the design system. Don't.                        │
 * │                                                                                        │
 * │  THE ONLY THING THAT CHANGES ON BUILD DAY IS THE ACCENT — one line, see ACCENT below.  │
 * └─────────────────────────────────────────────────────────────────────────────────────┘
 *
 * The colour VALUES themselves live as CSS variables in `app/globals.css` (shadcn model) so
 * that light/dark theming and Tailwind utilities stay in sync. This file documents the system,
 * exposes the type/spacing/radii/motion scales to TS/JS (charts, Framer Motion, PDF), and — for
 * the accent specifically — is the human-readable record of the one value the domain sets.
 */

/* ────────────────────────────────────────────────────────────────────────────────────────
 * ACCENT — THE ONE DOMAIN-DERIVED COLOUR
 *
 * DESIGN DIRECTION: "Dusk Route" — warm-charcoal base + SIGNAL-AMBER accent. Amber is the brand
 * signal, used sparingly. The full palette (incl. the warm-charcoal base) is produced in Claude
 * Design and arrives as a handoff; here we set ONLY the accent token to match it.
 *
 * WCAG (verified): amber-500 on charcoal ink #1A1D24 = 8.35:1; ink-on-amber = 8.70:1 (both AA).
 * On-accent TEXT is the dark ink #231703, NOT white (white on amber fails AA). Note: on the
 * current Phase-0 light/white surface, amber-500 as text is low-contrast — that is resolved by the
 * incoming charcoal base, not compensated here. See `docs/design-standards.md` §4.
 *
 * ►► This is the ONE colour the domain sets. To change it, edit the HSL below AND the matching
 *    `--accent` / `--accent-foreground` lines in `app/globals.css` (both :root and .dark).
 * ──────────────────────────────────────────────────────────────────────────────────────── */
export const ACCENT = {
  /** amber-500 — the signal accent. hsl(38 90% 55%) === #F4A726. Light + dark. */
  hsl: "38 90% 55%",
  /** text/icon colour that sits ON the amber fill: dark ink. hsl(38 84% 7%) === #231703. */
  foregroundHsl: "38 84% 7%",
  /** amber-600 — the primary button/fill in light mode. hsl(37 87% 42%) === #C9820E. */
  fillHsl: "37 87% 42%",
  /** amber-50 — soft status-badge accent fill in light mode. hsl(38 90% 92%) === #FDF0D9. */
  badgeHsl: "38 90% 92%",
  /** human note kept in sync with the values above */
  note: "Dusk Route accent: signal amber (amber-500 #F4A726). On-accent text is ink #231703.",
} as const;

/* ────────────────────────────────────────────────────────────────────────────────────────
 * TYPE SCALE — LOCKED
 * Faces: Space Grotesk (display) · IBM Plex Sans (body) · IBM Plex Mono (data).
 * Wired via next/font/google in app/layout.tsx; exposed to Tailwind as font-display/-sans/-mono.
 * ──────────────────────────────────────────────────────────────────────────────────────── */
export const fontFamily = {
  display: "var(--font-display)", // Space Grotesk
  sans: "var(--font-sans)", // IBM Plex Sans
  mono: "var(--font-mono)", // IBM Plex Mono
} as const;

/** rem sizes paired with their locked line-heights and tracking. */
export const typeScale = {
  // Display / headings — Space Grotesk, tight leading, negative tracking.
  display2xl: { size: "4.5rem", lineHeight: "1.05", tracking: "-0.02em", weight: 700 }, // 72
  displayXl: { size: "3.75rem", lineHeight: "1.05", tracking: "-0.02em", weight: 700 }, // 60
  displayLg: { size: "3rem", lineHeight: "1.08", tracking: "-0.02em", weight: 600 }, // 48
  h1: { size: "2.25rem", lineHeight: "1.15", tracking: "-0.015em", weight: 600 }, // 36
  h2: { size: "1.875rem", lineHeight: "1.2", tracking: "-0.01em", weight: 600 }, // 30
  h3: { size: "1.5rem", lineHeight: "1.25", tracking: "-0.01em", weight: 600 }, // 24
  h4: { size: "1.25rem", lineHeight: "1.3", tracking: "-0.005em", weight: 600 }, // 20

  // Body — IBM Plex Sans, comfortable leading (1.5–1.7).
  lg: { size: "1.125rem", lineHeight: "1.6", tracking: "0", weight: 400 }, // 18
  base: { size: "1rem", lineHeight: "1.6", tracking: "0", weight: 400 }, // 16
  sm: { size: "0.875rem", lineHeight: "1.55", tracking: "0", weight: 400 }, // 14
  xs: { size: "0.75rem", lineHeight: "1.5", tracking: "0.01em", weight: 400 }, // 12

  // Data — IBM Plex Mono, tabular numerals. Used in the DataTable and figures.
  mono: { size: "0.875rem", lineHeight: "1.5", tracking: "0", weight: 400 },
  monoSm: { size: "0.75rem", lineHeight: "1.5", tracking: "0", weight: 400 },
} as const;

/* ────────────────────────────────────────────────────────────────────────────────────────
 * SPACING — LOCKED. 4px base grid. Use the scale; never hand-pick pixels per screen (§5).
 * (Tailwind's default spacing already follows this 4px grid; these names are for JS/PDF/charts.)
 * ──────────────────────────────────────────────────────────────────────────────────────── */
export const spacing = {
  px: "1px",
  0.5: "0.125rem", // 2
  1: "0.25rem", // 4
  2: "0.5rem", // 8
  3: "0.75rem", // 12
  4: "1rem", // 16
  5: "1.25rem", // 20
  6: "1.5rem", // 24
  8: "2rem", // 32
  10: "2.5rem", // 40
  12: "3rem", // 48
  16: "4rem", // 64
  20: "5rem", // 80
  24: "6rem", // 96
} as const;

/* ────────────────────────────────────────────────────────────────────────────────────────
 * RADII — LOCKED. Driven off a single --radius CSS var (shadcn model) = 0.5rem.
 * ──────────────────────────────────────────────────────────────────────────────────────── */
export const radii = {
  sm: "calc(var(--radius) - 4px)", // 4
  md: "calc(var(--radius) - 2px)", // 6
  lg: "var(--radius)", // 8
  xl: "calc(var(--radius) + 4px)", // 12
  full: "9999px",
  base: "0.5rem",
} as const;

/* ────────────────────────────────────────────────────────────────────────────────────────
 * MOTION — LOCKED. One orchestrated reveal + subtle hover (§6). prefers-reduced-motion respected.
 * Consumed by Framer Motion. Durations in seconds (Framer) with ms noted.
 * ──────────────────────────────────────────────────────────────────────────────────────── */
export const motion = {
  duration: {
    fast: 0.15, // 150ms — hover, focus, small state changes
    base: 0.25, // 250ms — most transitions
    slow: 0.4, // 400ms — entrance of a section
    slower: 0.6, // 600ms — the one orchestrated page-load reveal
  },
  ease: {
    // cubic-bezier control points, Framer-ready as [x1,y1,x2,y2]
    standard: [0.4, 0, 0.2, 1], // material-standard; the default
    out: [0, 0, 0.2, 1], // decelerate — entrances
    in: [0.4, 0, 1, 1], // accelerate — exits
    spring: [0.34, 1.56, 0.64, 1], // gentle overshoot for playful hovers
  },
  /** stagger between children in the orchestrated load reveal */
  stagger: 0.06,
} as const;

/* ────────────────────────────────────────────────────────────────────────────────────────
 * SHADOWS — LOCKED. Shadow is an ACCENT, not a texture (§1). Sparse, low-elevation set.
 * ──────────────────────────────────────────────────────────────────────────────────────── */
export const shadow = {
  xs: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
  sm: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)",
} as const;

/** Breakpoints — mobile-first. Verified widths per §7: 375 / 768 / 1024 / 1440. */
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

export const designTokens = {
  ACCENT,
  fontFamily,
  typeScale,
  spacing,
  radii,
  motion,
  shadow,
  breakpoints,
} as const;

export type DesignTokens = typeof designTokens;
