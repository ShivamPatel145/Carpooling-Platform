# UI

**When to use this:** building any screen, page, or component. The bar is: a stranger glancing for two
seconds must NOT be able to say "an AI made this." Governed by the `design-standards` skill and
`docs/design-standards.md` (§0–§9). Read that file before the first UI task of a session.

```
Build the {{feature}} UI (screen / component: {{name and route}}). Follow the design-standards skill
and docs/design-standards.md — it overrides your taste and shadcn defaults. Compose existing
primitives; do not hand-roll what already exists.

USE THESE — by name, not approximation:
- Layout: the dashboard shell (@/components/shell) — sidebar + top nav, dark-mode aware. Pages sit
  inside app/(dashboard). Use <PageHeader> for the title row.
- Lists: <DataTable> from @/components/data-table. NEVER a hand-built <table> — search, filters, and
  pagination are already in it. Pass columns, data, isLoading, isError, onRetry, searchColumn, and
  `facets` for status filters.
- Forms: the field primitives in @/components/form (TextField, SelectField, DateField, SwitchField,
  FileField) inside RHF + zodResolver on the entity's shared schema. Don't hand-wire <input>s.
- The FIVE data states, from @/components/states, on EVERY screen:
    loading skeleton (Spinner/TableSkeleton/CardGridSkeleton/FormSkeleton) · empty (EmptyState —
    with a title, a description, and an action; an empty state is not a blank div) · error
    (ErrorState with onRetry) · success (toast() from @/hooks/use-toast) · status (StatusBadge).
- Charts: recharts, via the /dataviz skill and a colorblind-safe palette (see the analytics prompt).

DESIGN LAW — HARD BANS (reject on sight, §1):
  NO purple / violet / indigo as primary (the single biggest AI tell) · NO purple↔blue or
  purple↔pink gradients anywhere · NO gradient-filled headline words · NO rows of large made-up
  stats (a number ships only if it's real and sourced) · NO emoji in headings · NO "Why Choose Us" /
  "Transform your X into Y" slogans · NO default glassmorphism (frosted/blur/glow) · NO pill-badge
  clutter under a hero · NO everything-centered-one-column · NO reverting type to Inter/system-ui ·
  NO soft drop shadow on every card (shadow is an accent, not a texture).

DESIGN LAW — DO:
- Type is LOCKED (§3): Space Grotesk (display) · IBM Plex Sans (body) · IBM Plex Mono (tabular
  numerals, IDs, figures in tables). Numbers and IDs get `font-mono tabular-nums`. Do not relitigate
  the type system.
- Colour (§4): confident neutral base + the ONE accent token (the `accent` colour / `text-accent`),
  used sparingly as a signal. Do not introduce a second accent or hardcode hexes. WCAG AA: 4.5:1
  body, 3:1 large text.
- Spacing / radii / motion come from lib/design-tokens.ts — use the scale, don't hand-pick pixels
  screen by screen. Verify the spacing actually applies (watch CSS specificity), don't assume.
- Motion (§6, Framer Motion): ONE orchestrated reveal + subtle hover micro-interactions, not effects
  on every element. Respect prefers-reduced-motion. Use @/components/motion/reveal where it fits.
- Register (§2): professional B2B / ERP tool — clean, minimal, dashboard-first. Minimal is not
  generic: restraint executed precisely. Energy comes from composition and type, not gradients.

QUALITY FLOOR (§7, built in silently): visible keyboard focus states · semantic HTML · alt text
(empty alt on decorative images) · every form control has a real associated <label> · responsive
mobile-first, verified at 375 / 768 / 1024 / 1440, tap targets ≥44×44px, no horizontal scroll, the
mobile menu actually works.

WHAT THIS SCREEN SHOWS / DOES: {{describe the content, the data it reads, the actions, the states}}

Before you call it done, run the §9 vibe-code checklist from docs/design-standards.md — every one of
the twelve answers must be NO — then remove one thing that isn't earning its place.
```

## Notes — check in the output

- **Run the §9 vibe-code checklist yourself against the result.** Any purple/indigo, any gradient, any
  fabricated stat row, any emoji heading, any all-centered column, any Inter fallback = reject.
- **Primitives, not reinventions.** `<DataTable>` for lists, `@/components/form` fields for forms,
  `@/components/states` for the five states, the shell for layout. Hand-built versions are the tell.
- **All five states present**, and the empty state has real copy + an action.
- **Type is the locked trio**, numbers/IDs are `font-mono tabular-nums`. No `font-sans` fallback to
  system-ui, no ad-hoc font import.
- **Accent is the token**, used sparingly. Grep for hardcoded hex colors and for `#7c3aed`/`#8b5cf6`/
  `#6366f1`-family values — there should be none.
- **Responsive + a11y floor**: labels on inputs, focus rings visible, no horizontal scroll at 375px,
  working mobile menu.
- **Motion is one considered moment**, not effects sprinkled everywhere; `prefers-reduced-motion`
  honored.
