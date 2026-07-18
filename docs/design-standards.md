# Design Standards

> **Status.** This is the project's complete visual design law. It is the full text that the
> `design-standards` skill enforces in summary. It overrides individual taste, shadcn defaults,
> and any generated design's default aesthetic. Read it in full before the first UI task of any
> session.
>
> **Provenance.** Authored in Phase 0 from the team's `CLAUDEwebdesign.md` master prompt. If the
> original `CLAUDEwebdesign.md` is later added to the repo and differs, reconcile the two and keep
> this file as the single enforced source. The section numbers below (§0–§9) are the stable
> reference the skills cite.

---

## §0 — The rule that matters most

**If a stranger could glance at the page for two seconds and say "an AI made this," the screen
has failed** — regardless of whether the code works. Distinctiveness and restraint are the job,
not a bonus. This competition is judged partly on whether the product reads as a real tool built
by people who build software for a living.

This rule sits in apparent tension with §7 ("professional, clean, minimal"). §5 resolves it:
minimal directions need *precise* spacing and detail. Restraint executed precisely. A defaulted
minimal page and a considered minimal page look nothing alike to the person judging this.
"It's supposed to be professional" is never a defence for a defaulted screen.

---

## §1 — Hard bans (reject on sight — in generation AND review)

These are not preferences. They are the fingerprints of generated work.

- **Purple / violet / indigo as primary.** `#7c3aed`, `#8b5cf6`, `#a855f7`, `#6366f1` and their
  neighbours. The single biggest tell.
- **Purple↔blue or purple↔pink gradients**, anywhere — background, button, or text.
- **Gradient-filled headline words.**
- **Rows of large meaningless stats** ("25% · 95% · 2025"). A number ships only if it is real and
  sourced.
- **Emoji in headings or section titles.**
- **"Why Choose Us", "Transform your X into Y",** and interchangeable SaaS slogans.
- **Glassmorphism by default** — frosted cards, heavy blur, soft glow.
- **Pill-badge clutter under the hero.**
- **Everything centered in one column, top to bottom.**
- **Raw Inter / system-ui as the entire type system.** (This is exactly what shadcn defaults to.
  See §3 — reverting to it is a violation, not a simplification.)
- **Soft drop shadows on every card.** Shadow is an accent, not a texture.

---

## §2 — Our register: professional, and that is not the same as generic

The product must read as a real SaaS / ERP tool to a reviewer who builds software for a living:
clean, minimal, dashboard-first, business-focused. Distinctiveness comes from **precision, not
decoration**. Want energy? Get it from composition and type, not gradients and glow.

---

## §3 — Type system (LOCKED — do not relitigate)

The type system was decided in Phase 0, synced, and published to Claude Design. It is
domain-independent (our register is "professional B2B tool"), so it is not a bet, and changing it
desynchronises the design system.

| Role | Face | Use |
|---|---|---|
| **Display** | **Space Grotesk** | Headings — personality without shouting |
| **Body** | **IBM Plex Sans** | Dense UI: forms, nav, long copy |
| **Data** | **IBM Plex Mono** | Tabular numerals, IDs, and figures in the DataTable |

Rules:
- Load via `next/font/google` with `font-display: swap` and **real fallback stacks**.
- **Explicit scale** — sizes, weights, line-heights, letter-spacing all defined in
  `lib/design-tokens.ts`. Nothing left to the browser default.
- **Headlines:** tighter leading, negative tracking.
- **Body:** line-height **1.5–1.7**.
- **Mono:** `font-variant-numeric: tabular-nums` so figures align in columns.
- Reverting any face to Inter / system-ui is a §1 violation.

**Reviewer answer:** Plex Sans is designed for dense UI, Plex Mono aligns numerals in the
DataTable, Space Grotesk gives headings personality without shouting.

---

## §4 — Colour

- **Confident neutral base + ONE disciplined accent**, used sparingly as a *signal* colour, not a
  brand statement.
- The neutral base is shadcn's, untouched — a confident neutral and the correct placeholder. It
  is locked, synced, and published.
- **The accent is the only colour that changes** — one domain-derived value, set once (~9:35 on
  build day), one line in `lib/design-tokens.ts`. Do not add a second accent.
- **WCAG AA is mandatory:** 4.5:1 for body text, 3:1 for large text. Verify against the current
  accent — the domain swap must not silently break contrast.
- **No purple / violet. No gradients. Ever.** (§1.)

---

## §5 — Precision is the differentiator

Minimal directions need precise spacing and detail. The spacing scale, radii, and motion
durations/easings in `lib/design-tokens.ts` are domain-agnostic craft and are locked. Use the
scale; do not hand-pick arbitrary pixel values screen by screen. Verify that spacing you intend
actually *applies* — watch CSS specificity rather than assuming a class took effect.

---

## §6 — Motion (Framer Motion)

- **One orchestrated page-load reveal** plus subtle hover micro-interactions. One considered
  moment beats scattered effects — excess animation is itself an AI tell.
- Public homepage: a single orchestrated load reveal + scroll-triggered section reveals. Not
  effects on every element.
- **`prefers-reduced-motion` is always respected.** No exceptions.
- Durations and easings come from the motion tokens, not per-component magic numbers.

---

## §7 — Quality floor (built in silently, on every screen)

- Visible keyboard focus states.
- Semantic HTML.
- `alt` text on meaningful images; empty `alt` on decorative ones.
- Every form control has a real, associated `<label>`.
- **Responsive:** mobile-first, verified at **375 / 768 / 1024 / 1440**. Tap targets ≥ 44×44px.
  No horizontal scroll. The mobile menu actually works.
- **All five data states on every screen:** loading skeleton · empty · error · success toast ·
  status badge. An empty state is not a blank div.

This floor is what separates "real SaaS tool" from "hackathon prototype" at a glance.

---

## §8 — Project-specific rules

1. **The ODOO wireframe (`docs/wireframe/`) sets layout.** Where it conflicts with a hard ban:
   **structure wins, styling loses.** Keep its information architecture; replace its styling with
   `lib/design-tokens.ts`.
2. **The token system is `lib/design-tokens.ts`.** The neutral base and type system are locked,
   synced, and published to Claude Design. Only the **accent** changes — one line. Don't redesign
   what's already synced; you'll desynchronise the design system and burn the window re-syncing.
3. **Claude Design output is not exempt.** If a generated design lands on a documented default
   aesthetic — cream-and-terracotta warmth, near-black with one neon accent, or hairline-rule
   broadsheet — that is the tool's default, not a decision. Push back before it becomes the
   product's visual identity.

---

## §9 — The vibe-code checklist (run before marking ANY screen done)

**Every answer must be NO.** A single YES is a rejection, not a nitpick.

1. Is the primary colour purple / violet / indigo, or anywhere near it?
2. Is there a purple↔blue or purple↔pink gradient anywhere — background, button, or text?
3. Is any headline word gradient-filled?
4. Is there a row of large stats that aren't real, sourced numbers?
5. Is there an emoji in a heading or section title?
6. Does any copy read "Why Choose Us", "Transform your X into Y", or an interchangeable SaaS slogan?
7. Is the default look frosted glass / heavy blur / soft glow (glassmorphism)?
8. Is there a cluster of pill badges under the hero?
9. Is the whole page one centered column, top to bottom?
10. Is the type system raw Inter / system-ui (i.e. not Space Grotesk / IBM Plex Sans / IBM Plex Mono)?
11. Does every card carry a soft drop shadow (shadow used as texture, not accent)?
12. Would a stranger glancing for two seconds say "an AI made this"?

If all twelve are NO, apply **Chanel's rule**: remove one thing that isn't earning its place.
